#!/usr/bin/env python3
"""
SocialDrive AI - Video/Slideshow Creator
Creates animated GIFs and slideshows from images

Features:
- Animated GIF creation
- Slideshow with transitions
- Add text overlays
- Background music (if ffmpeg available)
- Multiple aspect ratios

Usage:
    python3 video-creator.py gif image1.jpg image2.jpg image3.jpg --output animation.gif
    python3 video-creator.py slideshow ./images --output slideshow.mp4 --duration 3
    python3 video-creator.py carousel image1.jpg image2.jpg --output instagram-carousel.gif
"""

import sys
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import io

# Check dependencies
try:
    from PIL import Image
    PILLOW_AVAILABLE = True
except ImportError:
    PILLOW_AVAILABLE = False
    print("❌ Pillow not installed. Run: pip3 install Pillow")

def check_ffmpeg():
    """Check if ffmpeg is available"""
    import subprocess
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, timeout=5)
        return True
    except:
        return False

def create_animated_gif(images, output_path, duration=500, size=(1080, 1080)):
    """Create animated GIF from images"""
    if not PILLOW_AVAILABLE:
        print("❌ Pillow required")
        return False
    
    try:
        frames = []
        
        for img_path in images:
            img = Image.open(img_path)
            
            # Resize and convert
            img = img.resize(size, Image.Resampling.LANCZOS)
            
            # Convert to RGB (GIF doesn't support transparency)
            if img.mode in ('RGBA', 'LA'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            frames.append(img)
        
        # Save as GIF
        frames[0].save(
            output_path,
            format='GIF',
            save_all=True,
            append_images=frames[1:],
            duration=duration,
            loop=0,  # Infinite loop
            optimize=True
        )
        
        print(f"✓ Created animated GIF: {output_path}")
        print(f"  - {len(frames)} frames")
        print(f"  - {duration}ms per frame")
        print(f"  - Size: {size[0]}x{size[1]}")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def create_slideshow(images, output_path, duration=3, size=(1920, 1080), transition='fade'):
    """Create slideshow video (requires ffmpeg)"""
    has_ffmpeg = check_ffmpeg()
    
    if not has_ffmpeg:
        print("⚠️  ffmpeg not available. Creating animated GIF instead...")
        # Fallback to GIF
        gif_path = output_path.replace('.mp4', '.gif').replace('.avi', '.gif')
        return create_animated_gif(images, gif_path, duration * 1000, size)
    
    import subprocess
    import tempfile
    
    try:
        # Create temporary file list for ffmpeg
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            for img_path in images:
                f.write(f"file '{img_path}'\n")
                f.write(f"duration {duration}\n")
            # Duplicate last frame
            f.write(f"file '{images[-1]}'\n")
            temp_list = f.name
        
        # FFmpeg command
        cmd = [
            'ffmpeg', '-y',
            '-f', 'concat',
            '-safe', '0',
            '-i', temp_list,
            '-vf', f'scale={size[0]}:{size[1]}:force_original_aspect_ratio=decrease,pad={size[0]}:{size[1]}:(ow-iw)/2:(oh-ih)/2',
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-r', '30',
            output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        # Cleanup
        os.unlink(temp_list)
        
        if result.returncode == 0:
            print(f"✓ Created slideshow: {output_path}")
            print(f"  - {len(images)} images")
            print(f"  - {duration}s per image")
            print(f"  - Size: {size[0]}x{size[1]}")
            return True
        else:
            print(f"❌ FFmpeg error: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def create_instagram_carousel(images, output_path, size=(1080, 1080), duration=800):
    """Create Instagram-style carousel (GIF with smooth transitions)"""
    if not PILLOW_AVAILABLE:
        print("❌ Pillow required")
        return False
    
    try:
        frames = []
        
        for i, img_path in enumerate(images):
            img = Image.open(img_path)
            img = img.resize(size, Image.Resampling.LANCZOS)
            
            # Convert to RGB
            if img.mode in ('RGBA', 'LA'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Add slide number
            draw = ImageDraw.Draw(img)
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 48)
            except:
                font = ImageFont.load_default()
            
            # Slide indicator
            text = f"{i+1} / {len(images)}"
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            x = size[0] - text_width - 20
            y = size[1] - text_height - 20
            
            # Draw background for text
            draw.rectangle([x-10, y-10, x+text_width+10, y+text_height+10], fill=(0, 0, 0, 128))
            draw.text((x, y), text, font=font, fill=(255, 255, 255, 255))
            
            frames.append(img)
        
        # Save as GIF with calculated duration
        frames[0].save(
            output_path,
            format='GIF',
            save_all=True,
            append_images=frames[1:],
            duration=duration,  # Use passed duration
            loop=0,
            optimize=True
        )
        
        print(f"✓ Created Instagram carousel: {output_path}")
        print(f"  - {len(frames)} slides")
        print(f"  - {duration}ms per slide")
        print(f"  - Total duration: {len(frames) * duration / 1000:.1f}s")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def create_before_after(images, output_path, size=(1080, 1080)):
    """Create before/after comparison GIF"""
    if len(images) < 2:
        print("❌ Need at least 2 images for before/after")
        return False
    
    if not PILLOW_AVAILABLE:
        print("❌ Pillow required")
        return False
    
    try:
        before_img = Image.open(images[0]).resize(size, Image.Resampling.LANCZOS)
        after_img = Image.open(images[1]).resize(size, Image.Resampling.LANCZOS)
        
        # Convert to RGB
        for img in [before_img, after_img]:
            if img.mode in ('RGBA', 'LA'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
        
        # Create frames with labels
        frames = []
        
        # Before frame
        draw = ImageDraw.Draw(before_img)
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 72)
        except:
            font = ImageFont.load_default()
        
        # Add "BEFORE" label
        text = "BEFORE"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        draw.rectangle([20, 20, text_width + 40, 90], fill=(0, 0, 0, 180))
        draw.text((30, 30), text, font=font, fill=(255, 255, 255, 255))
        frames.append(before_img.copy())
        
        # After frame
        draw = ImageDraw.Draw(after_img)
        text = "AFTER"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        draw.rectangle([20, 20, text_width + 40, 90], fill=(0, 128, 0, 180))
        draw.text((30, 30), text, font=font, fill=(255, 255, 255, 255))
        frames.append(after_img.copy())
        
        # Save as GIF (toggle between before/after)
        frames[0].save(
            output_path,
            format='GIF',
            save_all=True,
            append_images=frames[1:],
            duration=1500,  # 1.5 seconds per frame
            loop=0,
            optimize=True
        )
        
        print(f"✓ Created before/after comparison: {output_path}")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def create_story_slideshow(images, output_path, size=(1080, 1920)):
    """Create Instagram/Facebook Story format"""
    return create_animated_gif(images, output_path, duration=1000, size=size)

def process_directory(input_dir, output_dir, mode='gif'):
    """Process all images in directory"""
    if not PILLOW_AVAILABLE:
        print("❌ Pillow required")
        return False
    
    # Get all images
    extensions = ['.jpg', '.jpeg', '.png', '.webp']
    images = []
    
    for ext in extensions:
        images.extend(Path(input_dir).glob(f'*{ext}'))
        images.extend(Path(input_dir).glob(f'*{ext.upper()}'))
    
    if not images:
        print(f"❌ No images found in {input_dir}")
        return False
    
    images = sorted(images)
    print(f"Found {len(images)} images")
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    if mode == 'gif':
        output_path = os.path.join(output_dir, 'slideshow.gif')
        return create_animated_gif([str(p) for p in images], output_path)
    elif mode == 'carousel':
        output_path = os.path.join(output_dir, 'carousel.gif')
        return create_instagram_carousel([str(p) for p in images], output_path)
    elif mode == 'before_after' and len(images) >= 2:
        output_path = os.path.join(output_dir, 'before_after.gif')
        return create_before_after([str(images[0]), str(images[1])], output_path)
    elif mode == 'story':
        output_path = os.path.join(output_dir, 'story.gif')
        return create_story_slideshow([str(p) for p in images], output_path)
    else:
        print(f"❌ Unknown mode: {mode}")
        return False

def show_help():
    """Display help"""
    help_text = """
SocialDrive AI - Video/Slideshow Creator
=========================================

Usage:
    python3 video-creator.py <mode> <images...> --output <file>

Modes:
    gif image1.jpg image2.jpg image3.jpg
        Create animated GIF from images
    
    carousel image1.jpg image2.jpg image3.jpg
        Create Instagram-style carousel with slide numbers
    
    before_after before.jpg after.jpg
        Create before/after comparison (toggles between two images)
    
    story image1.jpg image2.jpg ...
        Create Instagram/Facebook Story format (1080x1920)
    
    slideshow ./image-folder/
        Create slideshow from all images in folder
    
    directory ./input/ ./output/ --mode gif
        Process entire directory

Options:
    --output PATH        Output file path
    --duration MS        Duration per frame in ms (default: 500)
    --total-duration SEC Total video duration in seconds (calculates per-frame duration)
    --size WxH           Output size (default: 1080x1080)
    --help               Show this help

Examples:
    python3 video-creator.py gif img1.jpg img2.jpg img3.jpg --output animation.gif
    python3 video-creator.py carousel img1.jpg img2.jpg --output instagram.gif
    python3 video-creator.py before_after before.jpg after.jpg --output comparison.gif
    python3 video-creator.py story img1.jpg img2.jpg --output story.gif --size 1080x1920
    python3 video-creator.py directory ./photos/ ./output/ --mode carousel

Output Formats:
    - .gif (always available)
    - .mp4 (only if ffmpeg is installed)
"""
    print(help_text)

def main():
    """Main entry point"""
    if len(sys.argv) < 2 or '--help' in sys.argv or '-h' in sys.argv:
        show_help()
        return
    
    if not PILLOW_AVAILABLE:
        print("\n⚠️  Installing Pillow...")
        print("Run: pip3 install Pillow")
        return
    
    mode = sys.argv[1]
    
    # Parse arguments
    args = {}
    images = []
    i = 2
    while i < len(sys.argv):
        if sys.argv[i].startswith('--'):
            key = sys.argv[i][2:]
            if i + 1 < len(sys.argv) and not sys.argv[i + 1].startswith('--'):
                args[key] = sys.argv[i + 1]
                i += 2
            else:
                args[key] = True
                i += 1
        else:
            images.append(sys.argv[i])
            i += 1
    
    output = args.get('output', 'output.gif')
    
    # Calculate duration
    if 'total_duration' in args:
        # User specified total video length - calculate per-frame duration
        total_seconds = float(args['total_duration'])
        num_images = len(images)
        if num_images > 0:
            duration = int((total_seconds * 1000) / num_images)
            print(f"📊 Total duration: {total_seconds}s | Images: {num_images} | Per-slide: {duration}ms")
        else:
            print("⚠️  No images provided, using default duration")
            duration = 500
    else:
        duration = int(args.get('duration', 500))
    
    size_str = args.get('size', '1080x1080')
    width, height = map(int, size_str.split('x'))
    
    # Execute based on mode
    if mode == 'gif':
        if len(images) < 1:
            print("❌ Need at least 1 image")
            return
        create_animated_gif(images, output, duration, (width, height))
    
    elif mode == 'carousel':
        if len(images) < 1:
            print("❌ Need at least 1 image")
            return
        create_instagram_carousel(images, output, (width, height), duration)
    
    elif mode == 'before_after':
        if len(images) < 2:
            print("❌ Need 2 images for before/after")
            return
        create_before_after(images, output, (width, height))
    
    elif mode == 'story':
        if len(images) < 1:
            print("❌ Need at least 1 image")
            return
        create_story_slideshow(images, output, (width, height))
    
    elif mode == 'slideshow':
        if not images:
            print("❌ Need input directory")
            return
        process_directory(images[0], os.path.dirname(output) or '.', 'gif')
    
    elif mode == 'directory':
        if len(images) < 2:
            print("❌ Need input and output directories")
            return
        process_directory(images[0], images[1], args.get('mode', 'gif'))
    
    else:
        print(f"❌ Unknown mode: {mode}")
        show_help()

if __name__ == '__main__':
    main()
