#!/usr/bin/env python3
"""
SocialDrive AI - MP4 Video Creator
Creates high-quality MP4 videos from images using ffmpeg

Advantages over GIF:
- 10x smaller file size (5MB vs 50MB)
- Full color, no banding
- Smooth playback
- Native social media support

Usage:
    python3 video-creator-mp4.py image1.jpg image2.jpg image3.jpg \
        --output video.mp4 \
        --duration 1.5 \
        --size 1080x1920 \
        --fps 30
"""

import argparse
import subprocess
import sys
import tempfile
from pathlib import Path
from PIL import Image

# Platform configurations
PLATFORMS = {
    'instagram': {
        'portrait': (1080, 1920),  # Stories, Reels
        'square': (1080, 1080),    # Feed
        'landscape': (1080, 608),  # Landscape posts
    },
    'tiktok': {
        'vertical': (1080, 1920),
    },
    'facebook': {
        'portrait': (1080, 1350),  # 4:5 ratio
        'square': (1080, 1080),
    },
    'linkedin': {
        'landscape': (1200, 627),
        'square': (1080, 1080),
    },
}

def create_mp4_video(images, output_path, duration=1.5, size=(1080, 1920), fps=30, transition='fade', quality='high'):
    """
    Create MP4 video from images using ffmpeg
    
    Args:
        images: List of image paths
        output_path: Output MP4 file path
        duration: Duration per image in seconds (default 1.5)
        size: Output size (width, height)
        fps: Frames per second (default 30 for smooth playback)
        transition: Transition effect ('fade', 'none', 'slide')
        quality: Video quality ('high', 'medium', 'low')
    
    Returns:
        Path to created video
    """
    if not images:
        raise ValueError("No images provided")
    
    # Quality settings (CRF: lower = better quality, 18-28 range)
    quality_settings = {
        'high': {'crf': 20, 'preset': 'slow'},      # Best quality, slower encode
        'medium': {'crf': 23, 'preset': 'medium'},  # Balanced
        'low': {'crf': 26, 'preset': 'fast'},       # Smaller file, faster encode
    }
    settings = quality_settings.get(quality, quality_settings['high'])
    
    # Create temp directory for processed images
    temp_dir = Path(tempfile.mkdtemp(prefix='sd-mp4-'))
    
    try:
        # Preprocess images (resize, pad, enhance)
        processed_images = []
        for i, img_path in enumerate(images):
            processed_path = temp_dir / f"frame_{i:03d}.jpg"
            preprocess_image(img_path, processed_path, size)
            processed_images.append(str(processed_path))
        
        print(f"✓ Preprocessed {len(processed_images)} images")
        
        # Create input file for ffmpeg concat
        concat_file = temp_dir / "concat.txt"
        with open(concat_file, 'w') as f:
            for img in processed_images:
                f.write(f"file '{img}'\n")
                f.write(f"duration {duration}\n")
            # Repeat last image to ensure final duration
            f.write(f"file '{processed_images[-1]}'\n")
        
        # Build ffmpeg command
        cmd = [
            'ffmpeg',
            '-f', 'concat',
            '-safe', '0',
            '-i', str(concat_file),
        ]
        
        # Note: Crossfade requires different approach with concat demuxer
        # For now, use simple concat without transitions (still looks good)
        
        # Output settings
        cmd.extend([
            '-c:v', 'libx264',           # H.264 codec (universal support)
            '-pix_fmt', 'yuv420p',       # Required for compatibility
            '-preset', settings['preset'],
            '-crf', str(settings['crf']),
            '-r', str(fps),              # Frame rate
            '-movflags', '+faststart',   # Enable streaming
            '-y',                        # Overwrite output
            str(output_path)
        ])
        
        print(f"🎬 Generating MP4 video...")
        print(f"   - {len(processed_images)} images")
        print(f"   - {duration}s per image")
        print(f"   - {size[0]}x{size[1]} @ {fps}fps")
        print(f"   - Quality: {quality} (CRF {settings['crf']})")
        
        # Run ffmpeg
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True
        )
        
        # Check output file
        if not Path(output_path).exists():
            raise Exception("ffmpeg completed but output file not found")
        
        file_size = Path(output_path).stat().st_size / (1024 * 1024)  # MB
        video_duration = len(processed_images) * duration
        
        print(f"✅ Created MP4: {output_path}")
        print(f"   - File size: {file_size:.2f} MB")
        print(f"   - Duration: {video_duration:.1f}s")
        
        return str(output_path)
        
    except subprocess.CalledProcessError as e:
        print(f"❌ ffmpeg error:")
        print(e.stderr)
        raise
    
    finally:
        # Cleanup temp files
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)


def preprocess_image(input_path, output_path, target_size):
    """
    Preprocess image: resize, pad, enhance
    
    Args:
        input_path: Input image path
        output_path: Output image path
        target_size: Target (width, height)
    """
    img = Image.open(input_path)
    
    # Convert to RGB
    if img.mode in ('RGBA', 'LA'):
        background = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode == 'RGBA':
            background.paste(img, mask=img.split()[-1])
        else:
            background.paste(img)
        img = background
    elif img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Resize with aspect ratio preservation
    img = resize_and_pad(img, target_size)
    
    # Slight enhancement to compensate for video compression
    try:
        from PIL import ImageEnhance
        enhancer = ImageEnhance.Sharpness(img)
        img = enhancer.enhance(1.1)  # Slight sharpness boost
        enhancer = ImageEnhance.Color(img)
        img = enhancer.enhance(1.05)  # Slight color boost
    except:
        pass
    
    # Save as high-quality JPEG
    img.save(output_path, 'JPEG', quality=95, optimize=True)


def resize_and_pad(img, target_size):
    """
    Resize image to fit target size, maintaining aspect ratio, and pad with black bars
    """
    target_w, target_h = target_size
    img_w, img_h = img.size
    
    # Calculate scale to fit within target size
    scale = min(target_w / img_w, target_h / img_h)
    new_w = int(img_w * scale)
    new_h = int(img_h * scale)
    
    # Resize
    img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Create padded image with black background
    padded = Image.new('RGB', target_size, (0, 0, 0))
    paste_x = (target_w - new_w) // 2
    paste_y = (target_h - new_h) // 2
    padded.paste(img, (paste_x, paste_y))
    
    return padded


def build_crossfade_filter(num_images, duration, fade_duration):
    """
    Build ffmpeg crossfade filter string
    
    Creates smooth transitions between images
    """
    if num_images < 2:
        return None
    
    # Calculate fade offset (when to start fading)
    fade_offset = duration - fade_duration
    
    # Build filter chain
    filters = []
    for i in range(num_images - 1):
        offset = i * duration + fade_offset
        if i == 0:
            filters.append(f"[0:v][1:v]xfade=transition=fade:duration={fade_duration}:offset={offset}[v1]")
        else:
            filters.append(f"[v{i}][{i+1}:v]xfade=transition=fade:duration={fade_duration}:offset={offset}[v{i+1}]")
    
    return ';'.join(filters)


def create_video_for_platforms(images, output_base, platforms=['instagram'], duration=1.5, quality='high'):
    """
    Create videos for multiple platforms in one go
    
    Args:
        images: List of image paths
        output_base: Base output path (will append platform/format)
        platforms: List of platforms ('instagram', 'tiktok', etc.)
        duration: Duration per image
        quality: Video quality
    
    Returns:
        Dict of created videos {platform_format: path}
    """
    created = {}
    
    for platform in platforms:
        if platform not in PLATFORMS:
            print(f"⚠️  Unknown platform: {platform}")
            continue
        
        platform_config = PLATFORMS[platform]
        
        for format_name, size in platform_config.items():
            output_path = f"{output_base}_{platform}_{format_name}_{size[0]}x{size[1]}.mp4"
            
            try:
                create_mp4_video(
                    images=images,
                    output_path=output_path,
                    duration=duration,
                    size=size,
                    quality=quality,
                    transition='fade'
                )
                created[f"{platform}_{format_name}"] = output_path
            except Exception as e:
                print(f"❌ Failed to create {platform} {format_name}: {e}")
    
    return created


def main():
    parser = argparse.ArgumentParser(description='Create MP4 videos from images')
    parser.add_argument('images', nargs='+', help='Input images')
    parser.add_argument('--output', '-o', required=True, help='Output MP4 file')
    parser.add_argument('--duration', '-d', type=float, default=1.5, help='Duration per image (seconds)')
    parser.add_argument('--size', '-s', default='1080x1920', help='Output size (WxH)')
    parser.add_argument('--fps', type=int, default=30, help='Frames per second')
    parser.add_argument('--quality', '-q', choices=['high', 'medium', 'low'], default='high', help='Video quality')
    parser.add_argument('--transition', '-t', choices=['fade', 'none'], default='fade', help='Transition effect')
    parser.add_argument('--platforms', '-p', help='Generate for platforms (comma-separated: instagram,tiktok)')
    
    args = parser.parse_args()
    
    # Parse size
    width, height = map(int, args.size.split('x'))
    
    if args.platforms:
        # Multi-platform mode
        platforms = [p.strip() for p in args.platforms.split(',')]
        output_base = args.output.rsplit('.', 1)[0]  # Remove extension
        created = create_video_for_platforms(
            images=args.images,
            output_base=output_base,
            platforms=platforms,
            duration=args.duration,
            quality=args.quality
        )
        print(f"\n✅ Created {len(created)} videos:")
        for name, path in created.items():
            print(f"   - {name}: {path}")
    else:
        # Single video mode
        create_mp4_video(
            images=args.images,
            output_path=args.output,
            duration=args.duration,
            size=(width, height),
            fps=args.fps,
            quality=args.quality,
            transition=args.transition
        )


if __name__ == '__main__':
    main()
