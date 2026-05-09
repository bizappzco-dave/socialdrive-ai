#!/usr/bin/env python3
"""
SocialDrive AI - Video Generation Service

Polls Supabase for submissions needing video/carousel generation,
processes them locally, and uploads results to Supabase Storage.

Run this on any machine with Python + Supabase access.
Does NOT need to run on Vercel.

Usage:
    python3 video-generation-service.py
    
Or as a background service:
    nohup python3 video-generation-service.py > video-service.log 2>&1 &
"""

import os
import sys
import time
import tempfile
import subprocess
from datetime import datetime, timedelta
from pathlib import Path

# Supabase client
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("❌ Supabase client not installed. Run: pip3 install supabase")
    sys.exit(1)

# Configuration from environment
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://dqhnxzaktnejasqlfrjf.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')
POLL_INTERVAL_SECONDS = int(os.getenv('VIDEO_GEN_POLL_INTERVAL', '30'))
MAX_CONCURRENT_JOBS = int(os.getenv('VIDEO_GEN_MAX_JOBS', '1'))

# Workspace path for video creator script
WORKSPACE_DIR = Path(__file__).parent.absolute()
VIDEO_CREATOR_SCRIPT = WORKSPACE_DIR / 'video-creator-platforms.py'

def get_supabase_client() -> Client:
    """Create Supabase admin client"""
    if not SUPABASE_KEY:
        raise ValueError("SUPABASE_SERVICE_ROLE_KEY not configured")
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def get_pending_video_submissions(supabase: Client, limit: int = 5) -> list:
    """
    Get submissions that need video generation:
    - submission_type is 'video' or 'carousel'
    - status is 'ready' (posts generated but no video yet)
    - video_url is NULL
    """
    # Direct query (RPC function may not exist)
    try:
        response = supabase.from_('submissions').select('''
            id,
            client_id,
            client_name,
            submission_type,
            platforms,
            created_at
        ''').in_('submission_type', ['video', 'carousel']).eq('status', 'ready').is_('video_url', None).limit(limit).execute()
        
        return response.data if response.data else []
    except Exception as e:
        print(f"⚠️  Query failed: {e}")
        return []

def get_submission_images(supabase: Client, submission_id: str) -> list:
    """Get all images for a submission"""
    response = supabase.from_('submission_images').select('''
        image_url,
        image_filename,
        sort_order
    ''').eq('submission_id', submission_id).order('sort_order').execute()
    
    return response.data if response.data else []

def get_posts_for_submission(supabase: Client, submission_id: str) -> list:
    """Get all posts for a submission"""
    response = supabase.from_('posts').select('id').eq('submission_id', submission_id).execute()
    return response.data if response.data else []

def download_image(image_url: str, temp_dir: Path) -> str:
    """Download image from URL to temp file, return local path"""
    import urllib.request
    
    filename = Path(image_url).name
    local_path = temp_dir / filename
    
    print(f"  📥 Downloading: {filename}")
    urllib.request.urlretrieve(image_url, local_path)
    
    return str(local_path)

def generate_video(submission: dict, images: list, temp_dir: Path) -> dict:
    """
    Run video-creator-platforms.py to generate video/GIF
    
    Returns dict with generated file paths
    """
    submission_type = submission.get('submission_type', 'video')
    platforms = submission.get('platforms', ['instagram'])
    submission_id = submission['id']
    
    # Download images to temp directory
    local_image_paths = []
    for img in images:
        try:
            local_path = download_image(img['image_url'], temp_dir)
            local_image_paths.append(local_path)
        except Exception as e:
            print(f"⚠️  Failed to download {img['image_url']}: {e}")
    
    if not local_image_paths:
        raise ValueError(f"No images could be downloaded for submission {submission_id}")
    
    print(f"  ✓ Downloaded {len(local_image_paths)} images")
    
    # Build command
    platform_arg = ','.join(platforms) if isinstance(platforms, list) else platforms
    output_base = f"{temp_dir}/{submission_type}-{submission_id}"
    
    # Quote image paths for shell
    quoted_images = ' '.join([f'"{path}"' for path in local_image_paths])
    
    command = f"""
    cd {WORKSPACE_DIR} && \
    python3 video-creator-platforms.py {submission_type} {quoted_images} \\
      --platforms {platform_arg} \\
      --output {output_base}
    """
    
    print(f"🎬 Running: {command[:200]}...")
    
    # Run command
    result = subprocess.run(
        command,
        shell=True,
        capture_output=True,
        text=True,
        timeout=300  # 5 minute timeout
    )
    
    if result.returncode != 0:
        print(f"❌ Video generation failed: {result.stderr}")
        raise Exception(f"Video generation failed: {result.stderr}")
    
    # Parse output to find generated files
    generated_files = []
    for line in result.stdout.split('\n'):
        if '✓ Created GIF:' in line or '✓ Generated' in line:
            # Extract file path
            if ':' in line:
                file_path = line.split(':')[-1].strip()
                if file_path and Path(file_path).exists():
                    generated_files.append(file_path)
                    print(f"✓ Generated: {file_path}")
    
    return {
        'files': generated_files,
        'stdout': result.stdout,
        'stderr': result.stderr
    }

def upload_to_supabase_storage(supabase: Client, file_path: str, client_id: str, submission_id: str) -> str:
    """
    Upload generated video to Supabase Storage
    Returns public URL
    """
    bucket_name = 'submissions'
    file_name = Path(file_path).name
    object_path = f"{client_id}/videos/{submission_id}-{file_name}"
    
    print(f"📤 Uploading {file_path} to {bucket_name}/{object_path}")
    
    with open(file_path, 'rb') as f:
        file_data = f.read()
    
    response = supabase.storage.from_(bucket_name).upload(
        object_path,
        file_data,
        {'content-type': 'image/gif'}  # Currently generates GIF
    )
    
    # Get public URL
    public_url = supabase.storage.from_(bucket_name).get_public_url(object_path)
    
    print(f"✓ Uploaded: {public_url}")
    return public_url

def update_posts_with_video(supabase: Client, post_ids: list, video_url: str, submission_type: str):
    """Update all posts for a submission with the video URL"""
    if not post_ids:
        return
    
    response = supabase.from_('posts').update({
        'video_url': video_url,
        'post_type': submission_type
    }).in_('id', post_ids).execute()
    
    print(f"✓ Updated {len(post_ids)} posts with video URL")

def update_submission_with_video(supabase: Client, submission_id: str, video_url: str):
    """Update submission record with video URL"""
    response = supabase.from_('submissions').update({
        'video_url': video_url,
        'updated_at': datetime.utcnow().isoformat()
    }).eq('id', submission_id).execute()
    
    print(f"✓ Updated submission {submission_id}")

def process_submission(supabase: Client, submission: dict):
    """Process a single submission through the full video generation pipeline"""
    submission_id = submission['id']
    client_id = submission['client_id']
    submission_type = submission.get('submission_type', 'video')
    
    print(f"\n{'='*60}")
    print(f"🎬 Processing submission {submission_id}")
    print(f"   Type: {submission_type}")
    print(f"   Client: {submission.get('client_name', 'Unknown')}")
    print(f"{'='*60}")
    
    # Create temp directory
    temp_dir = Path(tempfile.mkdtemp(prefix=f"sd-{submission_id}-"))
    print(f"  📁 Temp dir: {temp_dir}")
    
    try:
        # Get images
        images = get_submission_images(supabase, submission_id)
        if not images:
            print(f"❌ No images found for submission {submission_id}")
            return False
        
        print(f"📷 Found {len(images)} images")
        
        # Get posts
        posts = get_posts_for_submission(supabase, submission_id)
        if not posts:
            print(f"❌ No posts found for submission {submission_id}")
            return False
        
        print(f"📝 Found {len(posts)} posts to update")
        
        # Generate video
        try:
            result = generate_video(submission, images, temp_dir)
            if not result['files']:
                print("❌ No video files generated")
                return False
        except Exception as e:
            print(f"❌ Video generation failed: {e}")
            return False
        
        # Upload each generated file and update posts
        for file_path in result['files']:
            try:
                # Upload to Supabase
                video_url = upload_to_supabase_storage(supabase, file_path, client_id, submission_id)
                
                # Update posts
                post_ids = [p['id'] for p in posts]
                update_posts_with_video(supabase, post_ids, video_url, submission_type)
                
                # Update submission
                update_submission_with_video(supabase, submission_id, video_url)
                
                # Clean up temp file
                try:
                    Path(file_path).unlink()
                    print(f"  Cleaned up temp file: {file_path}")
                except:
                    pass
                    
            except Exception as e:
                print(f"❌ Failed to upload/update: {e}")
                continue
        
        print(f"✅ Submission {submission_id} complete!")
        return True
        
    finally:
        # Clean up temp directory
        import shutil
        try:
            shutil.rmtree(temp_dir)
            print(f"  Cleaned up temp dir: {temp_dir}")
        except:
            pass

def main():
    """Main service loop"""
    print("="*60)
    print("🎬 SocialDrive AI - Video Generation Service")
    print("="*60)
    print(f"Supabase URL: {SUPABASE_URL[:40]}...")
    print(f"Poll interval: {POLL_INTERVAL_SECONDS}s")
    print(f"Video creator: {VIDEO_CREATOR_SCRIPT}")
    print(f"Started: {datetime.now().isoformat()}")
    print("="*60)
    
    # Verify video creator script exists
    if not VIDEO_CREATOR_SCRIPT.exists():
        print(f"❌ Video creator script not found: {VIDEO_CREATOR_SCRIPT}")
        sys.exit(1)
    
    # Connect to Supabase
    try:
        supabase = get_supabase_client()
        print("✓ Connected to Supabase")
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        sys.exit(1)
    
    # Main loop
    processed_count = 0
    error_count = 0
    
    while True:
        try:
            # Get pending submissions
            pending = get_pending_video_submissions(supabase, limit=MAX_CONCURRENT_JOBS)
            
            if pending:
                print(f"\n⏳ Found {len(pending)} pending submission(s)")
                
                for submission in pending:
                    try:
                        success = process_submission(supabase, submission)
                        if success:
                            processed_count += 1
                        else:
                            error_count += 1
                    except Exception as e:
                        print(f"❌ Error processing submission: {e}")
                        error_count += 1
            else:
                # No pending work
                timestamp = datetime.now().strftime('%H:%M:%S')
                print(f"[{timestamp}] No pending submissions (processed: {processed_count}, errors: {error_count})")
            
            # Wait before next poll
            time.sleep(POLL_INTERVAL_SECONDS)
            
        except KeyboardInterrupt:
            print("\n\n⏹️  Service stopped by user")
            print(f"Final stats: {processed_count} processed, {error_count} errors")
            break
        except Exception as e:
            print(f"❌ Service error: {e}")
            time.sleep(POLL_INTERVAL_SECONDS)

if __name__ == '__main__':
    main()
