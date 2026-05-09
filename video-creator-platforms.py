#!/usr/bin/env python3
"""
SocialDrive AI - Video/Slideshow Creator with Platform Support
Creates animated GIFs and slideshows from images

Features:
- Platform-specific format generation
- Auto-resize for each platform
- Multiple output formats in one run
- Smooth transitions

Usage:
    python3 video-creator.py carousel image1.jpg image2.jpg image3.jpg \
        --platforms instagram,tiktok \
        --output-square /tmp/square.gif \
        --output-vertical /tmp/vertical.mp4
    
    python3 video-creator.py video images/*.jpg \
        --platforms instagram,tiktok,linkedin \
        --output-all /tmp/
"""

import sys
import os
import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import io

# Check dependencies
try:
    from PIL import Image
    PILLOW_AVAILABLE = True
except ImportError:
    PILLOW_AVAILABLE = False
    print("❌ Pillow not installed. Run: pip3 install Pillow")
    sys.exit(1)

# Platform configurations
PLATFORM_CONFIG = {
    'instagram': {
        'feed': {'size': (1080, 1350), 'name': 'Portrait', 'ratio': '4:5'},
        'stories': {'size': (1080, 1920), 'name': 'Vertical', 'ratio': '9:16'},
    },
    'facebook': {
        'feed': {'size': (1200, 1500), 'name': 'Portrait', 'ratio': '4:5'},
        'stories': {'size': (1080, 1920), 'name': 'Vertical', 'ratio': '9:16'},
    },
    'tiktok': {
        'all': {'size': (1080, 1920), 'name': 'Vertical', 'ratio': '9:16'},
    },
    'linkedin': {
        'feed': {'size': (1080, 1080), 'name': 'Square', 'ratio': '1:1'},
    },
    'twitter': {
        'feed': {'size': (1200, 675), 'name': 'Landscape', 'ratio': '16:9'},
    },
}

def get_formats_for_platforms(platforms):
    """Get unique formats needed for selected platforms"""
    formats_needed = {}
    
    for platform in platforms:
        if platform not in PLATFORM_CONFIG:
            print(f"⚠️  Unknown platform: {platform}, skipping")
            continue
        
        config = PLATFORM_CONFIG[platform]
        for format_type, format_config in config.items():
            size = format_config['size']
            size_key = f"{size[0]}x{size[1]}"
            
            if size_key not in formats_needed:
                formats_needed[size_key] = {
                    'size': size,
                    'name': format_config['name'],
                    'ratio': format_config['ratio'],
                    'platforms': []
                }
            
            formats_needed[size_key]['platforms'].append(platform)
    
    return formats_needed

def create_animated_gif(images, output_path, duration=800, size=(1080, 1350), max_frames=8, quality='high'):
    """Create optimized animated GIF from images
    
    Args:
        images: List of image paths
        output_path: Output GIF path
        duration: Duration per frame in ms
        size: Target size (width, height)
        max_frames: Maximum frames to include (reduces file size)
        quality: 'low', 'medium', 'high' - affects palette and optimization
    """
    if not PILLOW_AVAILABLE:
        print("❌ Pillow required")
        return False
    
    try:
        # Limit frames to reduce file size
        if len(images) > max_frames:
            # Sample evenly from images
            step = len(images) / max_frames
            selected_indices = [int(i * step) % len(images) for i in range(max_frames)]
            selected_images = [images[i] for i in selected_indices]
            print(f"  ℹ️  Reduced from {len(images)} to {max_frames} frames")
        else:
            selected_images = images
        
        frames = []
        
        for img_path in selected_images:
            img = Image.open(img_path)
            
            # Smart resize with aspect ratio preservation
            img = resize_image_smart(img, size)
            
            # Convert to RGB (GIF doesn't support transparency)
            if img.mode in ('RGBA', 'LA'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Enhance color/contrast slightly to compensate for GIF color loss
            try:
                from PIL import ImageEnhance
                enhancer = ImageEnhance.Color(img)
                img = enhancer.enhance(1.1)  # Slight color boost
                enhancer = ImageEnhance.Contrast(img)
                img = enhancer.enhance(1.05)  # Slight contrast boost
            except:
                pass  # Skip if ImageEnhance not available
            
            frames.append(img)
        
        # GIF optimization settings based on quality
        palette_settings = {
            'low': {'palette': Image.ADAPTIVE, 'colors': 128},
            'medium': {'palette': Image.ADAPTIVE, 'colors': 192},
            'high': {'palette': Image.ADAPTIVE, 'colors': 256},
        }
        settings = palette_settings.get(quality, palette_settings['high'])
        
        # Save as GIF with optimization and dithering for better color quality
        frames[0].save(
            output_path,
            format='GIF',
            save_all=True,
            append_images=frames[1:],
            duration=duration,
            loop=0,  # Infinite loop
            optimize=True,
            disposal=2,  # Clear previous frame for better transitions
            **settings
        )
        
        # Check file size
        file_size = Path(output_path).stat().st_size / (1024 * 1024)  # MB
        print(f"✓ Created GIF: {output_path}")
        print(f"  - {len(frames)} frames")
        print(f"  - Size: {size[0]}x{size[1]}")
        print(f"  - File size: {file_size:.1f} MB")
        
        if file_size > 45:  # Warn if approaching 50MB limit
            print(f"  ⚠️  Warning: File size approaching Supabase limit (50MB)")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating GIF: {e}")
        return False

def resize_image_smart(img, target_size):
    """Resize image preserving aspect ratio, crop if needed"""
    target_w, target_h = target_size
    img_w, img_h = img.size
    
    # Calculate aspect ratios
    target_ratio = target_w / target_h
    img_ratio = img_w / img_h
    
    if img_ratio > target_ratio:
        # Image is wider than target - crop width
        new_w = int(img_h * target_ratio)
        new_h = img_h
        left = (img_w - new_w) // 2
        img = img.crop((left, 0, left + new_w, new_h))
    else:
        # Image is taller than target - crop height
        new_h = int(img_w / target_ratio)
        new_w = img_w
        top = (img_h - new_h) // 2
        img = img.crop((0, top, new_w, top + new_h))
    
    # Resize to target size
    img = img.resize(target_size, Image.Resampling.LANCZOS)
    
    return img

def create_carousel(images, output_path, platforms=['instagram']):
    """Create carousel for specified platforms"""
    formats = get_formats_for_platforms(platforms)
    
    if not formats:
        print("❌ No valid formats to generate")
        return False
    
    results = []
    
    for size_key, format_info in formats.items():
        size = format_info['size']
        output_filename = f"carousel_{size_key}.gif"
        output_file = os.path.join(os.path.dirname(output_path), output_filename)
        
        print(f"\n📱 Generating for: {', '.join(format_info['platforms'])}")
        print(f"   Format: {format_info['name']} ({format_info['ratio']})")
        print(f"   Size: {size[0]}x{size[1]}")
        
        # For video mode with many images, reduce frames and quality
        max_frames = 5 if len(images) > 10 else 7
        quality = 'low'  # Always use low quality for Supabase compatibility
        
        success = create_animated_gif(images, output_file, duration=800, size=size, max_frames=max_frames, quality=quality)
        
        if success:
            results.append({
                'platforms': format_info['platforms'],
                'format': format_info['name'],
                'size': size,
                'path': output_file
            })
    
    return results

def main():
    parser = argparse.ArgumentParser(description='SocialDrive AI - Video Creator')
    parser.add_argument('mode', choices=['carousel', 'video', 'gif'], 
                       help='Generation mode')
    parser.add_argument('images', nargs='+', help='Input images')
    parser.add_argument('--platforms', nargs='+', default=['instagram'],
                       help='Target platforms: instagram, tiktok, linkedin, facebook')
    parser.add_argument('--output', required=True, help='Output file path')
    parser.add_argument('--duration', type=int, default=800,
                       help='Duration per frame in ms (default: 800)')
    
    args = parser.parse_args()
    
    # Validate images exist
    for img_path in args.images:
        if not os.path.exists(img_path):
            print(f"❌ Image not found: {img_path}")
            sys.exit(1)
    
    print("🎬 SocialDrive AI - Video Creator")
    print("=" * 50)
    print(f"Mode: {args.mode}")
    print(f"Platforms: {', '.join(args.platforms)}")
    print(f"Images: {len(args.images)}")
    print("=" * 50)
    
    if args.mode == 'carousel':
        results = create_carousel(args.images, args.output, args.platforms)
        
        if results:
            print("\n" + "=" * 50)
            print("✅ Generation Complete!")
            print("=" * 50)
            for result in results:
                print(f"\n📱 {', '.join(result['platforms'])}")
                print(f"   Format: {result['format']}")
                print(f"   Size: {result['size'][0]}x{result['size'][1]}")
                print(f"   File: {result['path']}")
        else:
            print("\n❌ Failed to generate carousel")
            sys.exit(1)
    
    elif args.mode == 'gif':
        # Simple GIF generation (backward compatible)
        size = (1080, 1350)  # Default portrait (Instagram best practice)
        success = create_animated_gif(args.images, args.output, args.duration, size)
        
        if not success:
            sys.exit(1)
    
    elif args.mode == 'video':
        # TODO: Implement MP4 video generation with ffmpeg
        print("⚠️  Video mode (MP4) coming soon. Generating GIF instead...")
        results = create_carousel(args.images, args.output, args.platforms)
    
    print("\n✨ Done!")

if __name__ == '__main__':
    main()
