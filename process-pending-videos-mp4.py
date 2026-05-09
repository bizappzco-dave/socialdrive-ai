#!/usr/bin/env python3
"""
Process all pending VIDEO submissions (MP4 format)
Run this manually or via cron.

This replaces the GIF-based processor with high-quality MP4 generation.
"""

import os
import sys
import tempfile
import urllib.request
import shutil
from pathlib import Path

from supabase import create_client

# Import our MP4 creator (use exec to load the module)
import importlib.util
spec = importlib.util.spec_from_file_location("video_creator_mp4", Path(__file__).parent / "video-creator-mp4.py")
video_creator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(video_creator)
create_mp4_video = video_creator.create_mp4_video

# Config
SUPABASE_URL = 'https://dqhnxzaktnejasqlfrjf.supabase.co'
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')
WORKSPACE = Path(__file__).parent.absolute()

def main():
    if not SUPABASE_KEY:
        print("❌ Set SUPABASE_SERVICE_ROLE_KEY environment variable")
        sys.exit(1)
    
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Get pending VIDEO submissions (not carousels)
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
    platforms = submission.get('platforms', ['instagram'])
    
    print(f"{'='*60}")
    print(f"Processing: {sid}")
    print(f"Client: {submission['client_name']}")
    
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
    temp_dir = Path(tempfile.mkdtemp(prefix=f"sd-mp4-{sid[:8]}-"))
    
    try:
        # Download images
        # MP4 can handle more frames than GIF, so use up to 10
        max_frames = min(10, len(images))
        print(f"⚙️  Using {max_frames} frames")
        
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
        
        # Generate videos for each platform format
        print(f"🎬 Generating MP4 videos...")
        
        created_videos = {}
        
        # Determine target formats based on platforms
        platform_formats = {
            'instagram': [
                {'name': 'stories', 'size': (1080, 1920), 'desc': 'Instagram Stories/Reels'},
                {'name': 'feed', 'size': (1080, 1080), 'desc': 'Instagram Feed'},
            ],
            'tiktok': [
                {'name': 'vertical', 'size': (1080, 1920), 'desc': 'TikTok'},
            ],
            'facebook': [
                {'name': 'portrait', 'size': (1080, 1350), 'desc': 'Facebook 4:5'},
            ],
            'linkedin': [
                {'name': 'landscape', 'size': (1200, 627), 'desc': 'LinkedIn'},
            ],
        }
        
        # Generate for each platform
        for platform in platforms if isinstance(platforms, list) else [platforms]:
            if platform not in platform_formats:
                continue
            
            for format_config in platform_formats[platform]:
                output_filename = f"{sid[:8]}_{platform}_{format_config['name']}_{format_config['size'][0]}x{format_config['size'][1]}.mp4"
                output_path = temp_dir / output_filename
                
                try:
                    create_mp4_video(
                        images=local_paths,
                        output_path=str(output_path),
                        duration=1.5,  # 1.5 seconds per image
                        size=format_config['size'],
                        fps=30,
                        quality='high',
                        transition='none'
                    )
                    
                    created_videos[f"{platform}_{format_config['name']}"] = str(output_path)
                    print(f"  ✓ Generated: {format_config['desc']}")
                    
                except Exception as e:
                    print(f"  ❌ Failed {format_config['desc']}: {e}")
        
        if not created_videos:
            print("❌ No videos generated")
            return
        
        # Upload videos to Supabase storage
        print(f"📤 Uploading {len(created_videos)} videos...")
        
        uploaded_urls = []
        
        for format_name, video_path in created_videos.items():
            try:
                filename = Path(video_path).name
                object_path = f"{client_id}/videos/{filename}"
                
                with open(video_path, 'rb') as f:
                    data = f.read()
                
                # Upload
                supabase.storage.from_('submissions').upload(
                    object_path,
                    data,
                    {'content-type': 'video/mp4'}
                )
                
                # Get public URL
                video_url = supabase.storage.from_('submissions').get_public_url(object_path)
                uploaded_urls.append(video_url)
                
                file_size = len(data) / (1024 * 1024)
                print(f"  ✓ Uploaded {format_name}: {file_size:.2f} MB")
                
            except Exception as e:
                print(f"  ❌ Upload failed {format_name}: {e}")
        
        if not uploaded_urls:
            print("❌ No videos uploaded")
            return
        
        # Update submission with primary video URL (first one)
        primary_url = uploaded_urls[0]
        supabase.from_('submissions').update({'video_url': primary_url}).eq('id', sid).execute()
        
        # Update all posts
        post_ids = [p['id'] for p in posts]
        supabase.from_('posts').update({
            'video_url': primary_url,
            'post_type': 'video'
        }).in_('id', post_ids).execute()
        
        print(f"✅ Updated {len(post_ids)} posts")
        print(f"✅ Complete!\n")
        
    except Exception as e:
        print(f"❌ Error processing submission: {e}\n")
    
    finally:
        # Cleanup
        shutil.rmtree(temp_dir, ignore_errors=True)

if __name__ == '__main__':
    main()
