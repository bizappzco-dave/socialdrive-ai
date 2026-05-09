#!/usr/bin/env python3
"""
Process all pending video/carousel submissions in one run.
Run this manually or via cron.
"""

import os
import sys
import tempfile
import urllib.request
import subprocess
import shutil
from pathlib import Path
from datetime import datetime, timezone

from supabase import create_client

# Config
SUPABASE_URL = 'https://dqhnxzaktnejasqlfrjf.supabase.co'
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')
WORKSPACE = Path(__file__).parent.absolute()

def main():
    if not SUPABASE_KEY:
        print("❌ Set SUPABASE_SERVICE_ROLE_KEY environment variable")
        sys.exit(1)
    
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Get pending VIDEO submissions ONLY (carousels don't need video conversion)
    response = supabase.from_('submissions').select('*').eq('submission_type', 'video').eq('status', 'ready').is_('video_url', None).limit(10).execute()
    pending = response.data
    
    if not pending:
        print("✅ No pending video submissions")
        return
    
    print(f" Found {len(pending)} pending video submission(s)\n")
    
    for submission in pending:
        process_submission(supabase, submission)

def process_submission(supabase, submission):
    sid = submission['id']
    client_id = submission['client_id']
    stype = submission.get('submission_type', 'video')
    platforms = submission.get('platforms', ['instagram'])
    
    print(f"{'='*60}")
    print(f"Processing: {sid}")
    print(f"Type: {stype} | Client: {submission['client_name']}")
    
    # Get images
    response = supabase.from_('submission_images').select('image_url').eq('submission_id', sid).order('sort_order').execute()
    images = response.data
    
    if not images:
        print("❌ No images found\n")
        return
    
    print(f"📷 Images: {len(images)}")
    
    # Get posts
    response = supabase.from_('posts').select('id').eq('submission_id', sid).execute()
    posts = response.data
    print(f"📝 Posts: {len(posts)}")
    
    # Create temp dir
    temp_dir = Path(tempfile.mkdtemp(prefix=f"sd-{sid[:8]}-"))
    
    try:
        # Download images (limit based on total count to stay under 50MB)
        # Rule: Max 5 frames for Supabase free tier (50MB limit)
        # Even with 256 colors + optimization, 1080x1920 @ 7 frames > 50MB
        max_frames = min(5, len(images))
        print(f"⚙️  Using {max_frames} frames (file size optimization)")
        
        local_paths = []
        for img in images[:max_frames]:
            try:
                filename = Path(img['image_url']).name
                local_path = temp_dir / filename
                urllib.request.urlretrieve(img['image_url'], local_path)
                local_paths.append(str(local_path))
            except Exception as e:
                print(f"⚠️  Download failed: {e}")
        
        if not local_paths:
            print("❌ No images downloaded\n")
            return
        
        print(f"✓ Downloaded {len(local_paths)} images")
        
        # Generate video
        platform_arg = ','.join(platforms) if isinstance(platforms, list) else 'instagram'
        output_base = str(temp_dir / f"{stype}-{sid[:8]}")
        quoted_images = ' '.join([f'"{p}"' for p in local_paths])
        
        cmd = f"cd {WORKSPACE} && python3 video-creator-platforms.py {stype} {quoted_images} --platforms {platform_arg} --output {output_base}"
        
        print(f"🎬 Generating video...")
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=300)
        
        # Find generated files
        generated = []
        for line in result.stdout.split('\n'):
            if '✓ Created GIF:' in line:
                parts = line.split(':')
                if len(parts) > 1:
                    fpath = parts[-1].strip()
                    if Path(fpath).exists():
                        generated.append(fpath)
                        print(f"  ✓ Generated: {fpath}")
        
        if not generated:
            print("❌ No video files generated")
            print(result.stderr)
            return
        
        # Upload and update
        for gfile in generated:
            try:
                # Upload
                filename = Path(gfile).name
                object_path = f"{client_id}/videos/{sid}-{filename}"
                
                with open(gfile, 'rb') as f:
                    data = f.read()
                
                supabase.storage.from_('submissions').upload(object_path, data, {'content-type': 'image/gif'})
                video_url = supabase.storage.from_('submissions').get_public_url(object_path)
                
                print(f"📤 Uploaded: {video_url[:80]}...")
                
                # Update posts
                post_ids = [p['id'] for p in posts]
                supabase.from_('posts').update({'video_url': video_url, 'post_type': stype}).in_('id', post_ids).execute()
                
                # Update submission
                supabase.from_('submissions').update({'video_url': video_url}).eq('id', sid).execute()
                
                print(f"✅ Updated {len(post_ids)} posts")
                
            except Exception as e:
                print(f"❌ Upload/update failed: {e}")
        
        print(f"✅ Complete!\n")
        
    finally:
        # Cleanup
        shutil.rmtree(temp_dir, ignore_errors=True)

if __name__ == '__main__':
    main()
