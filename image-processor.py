#!/usr/bin/env python3
"""
SocialDrive AI - Image Processor
Handles image optimization for client content

Features:
- Resize images for social media
- Convert to WebP for web optimization
- Add watermarks
- Enhance quality (basic sharpening)
- Generate multiple sizes (Instagram, Facebook, Web)

Usage:
    python3 image-processor.py input.jpg --resize 1080x1080 --output instagram/
    python3 image-processor.py input.jpg --convert webp --quality 85
    python3 image-processor.py input.jpg --watermark "No Label Barber" --output watermarked.jpg
"""

import sys
import os
from pathlib import Path

# Check for required libraries
try:
    from PIL import Image, ImageFilter, ImageDraw, ImageFont
    PILLOW_AVAILABLE = True
except ImportError:
    PILLOW_AVAILABLE = False
    print("⚠️  Pillow not installed. Install with: pip3 install Pillow")

def check_dependencies():
    """Check what image tools are available"""
    tools = {}
    
    # Check Pillow
    tools['pillow'] = PILLOW_AVAILABLE
    
    # Check if we can import other useful libraries
    try:
        import numpy as np
        tools['numpy'] = True
    except:
        tools['numpy'] = False
    
    try:
        import cv2
        tools['opencv'] = True
    except:
        tools['opencv'] = False
    
    return tools

def resize_image(input_path, output_path, size=(1080, 1080)):
    """Resize image to specified dimensions"""
    if not PILLOW_AVAILABLE:
        print("❌ Pillow required for resize")
        return False
    
    try:
        img = Image.open(input_path)
        img = img.resize(size, Image.Resampling.LANCZOS)
        img.save(output_path, quality=95)
        print(f"✓ Resized to {size[0]}x{size[1]}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def convert_format(input_path, output_format='webp', quality=85):
    """Convert image to different format"""
    if not PILLOW_AVAILABLE:
        print("❌ Pillow required for conversion")
        return False
    
    try:
        img = Image.open(input_path)
        
        # Generate output path
        base = os.path.splitext(input_path)[0]
        output_path = f"{base}.{output_format}"
        
        # Handle transparency for JPEG
        if output_format.lower() == 'jpeg' and img.mode in ('RGBA', 'LA'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        
        img.save(output_path, output_format.upper(), quality=quality)
        print(f"✓ Converted to {output_format}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def add_watermark(input_path, output_path, text="SocialDrive AI"):
    """Add text watermark to image"""
    if not PILLOW_AVAILABLE:
        print("❌ Pillow required for watermark")
        return False
    
    try:
        img = Image.open(input_path)
        draw = ImageDraw.Draw(img)
        
        # Calculate position (bottom right)
        margin = 20
        bbox = draw.textbbox((0, 0), text)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        x = img.width - text_width - margin
        y = img.height - text_height - margin
        
        # Draw text with shadow
        draw.text((x+2, y+2), text, fill=(0, 0, 0, 128))
        draw.text((x, y), text, fill=(255, 255, 255, 200))
        
        img.save(output_path)
        print(f"✓ Watermark added")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def enhance_quality(input_path, output_path, sharpen_amount=1.5):
    """Basic quality enhancement (sharpening)"""
    if not PILLOW_AVAILABLE:
        print("❌ Pillow required for enhancement")
        return False
    
    try:
        img = Image.open(input_path)
        
        # Apply sharpening filter
        enhancer = ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3)
        img = img.filter(enhancer)
        
        # Slight contrast boost
        from PIL import ImageEnhancer
        enhancer = ImageEnhancer.Contrast(img)
        img = enhancer.enhance(1.1)
        
        img.save(output_path, quality=95)
        print(f"✓ Quality enhanced")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def generate_social_sizes(input_path, output_dir="output"):
    """Generate multiple sizes for different social platforms"""
    if not PILLOW_AVAILABLE:
        print("❌ Pillow required")
        return False
    
    # Social media dimensions
    sizes = {
        'instagram_square': (1080, 1080),
        'instagram_story': (1080, 1920),
        'facebook_post': (1200, 630),
        'facebook_cover': (820, 312),
        'twitter_post': (1200, 675),
        'linkedin_post': (1200, 627),
        'web_thumbnail': (400, 400),
    }
    
    try:
        img = Image.open(input_path)
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        
        results = {}
        for name, size in sizes.items():
            # Resize with smart cropping
            img_resized = img.copy()
            img_resized.thumbnail(size, Image.Resampling.LANCZOS)
            
            # Save
            output_path = os.path.join(output_dir, f"{base_name}_{name}.jpg")
            img_resized.save(output_path, quality=90)
            results[name] = output_path
        
        print(f"✓ Generated {len(results)} sizes in {output_dir}/")
        for name, path in results.items():
            print(f"  - {name}: {path}")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def process_batch(input_dir, output_dir, operation='resize'):
    """Process all images in a directory"""
    if not PILLOW_AVAILABLE:
        print("❌ Pillow required")
        return False
    
    # Supported extensions
    extensions = ['.jpg', '.jpeg', '.png', '.webp']
    
    # Get all image files
    images = []
    for ext in extensions:
        images.extend(Path(input_dir).glob(f'*{ext}'))
        images.extend(Path(input_dir).glob(f'*{ext.upper()}'))
    
    if not images:
        print(f"❌ No images found in {input_dir}")
        return False
    
    print(f"Found {len(images)} images to process")
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Process each image
    success = 0
    failed = 0
    
    for img_path in images:
        output_path = os.path.join(output_dir, img_path.name)
        
        if operation == 'resize':
            result = resize_image(str(img_path), output_path)
        elif operation == 'webp':
            result = convert_format(str(img_path), 'webp')
        elif operation == 'enhance':
            result = enhance_quality(str(img_path), output_path)
        
        if result:
            success += 1
        else:
            failed += 1
    
    print(f"\n✓ Complete: {success} succeeded, {failed} failed")
    return failed == 0

def show_help():
    """Display help information"""
    help_text = """
SocialDrive AI - Image Processor
================================

Usage:
    python3 image-processor.py <command> [options] <input>

Commands:
    resize <file> --size 1080x1080 --output <path>
        Resize image to specific dimensions
    
    convert <file> --format webp --quality 85 --output <path>
        Convert to different format (webp, jpg, png)
    
    enhance <file> --output <path>
        Enhance image quality (sharpening, contrast)
    
    watermark <file> --text "Your Text" --output <path>
        Add text watermark
    
    social <file> --output <directory>
        Generate all social media sizes
    
    batch <input_dir> --output <output_dir> --operation resize
        Process all images in a directory

Examples:
    python3 image-processor.py resize photo.jpg --size 1080x1080 --output instagram.jpg
    python3 image-processor.py convert photo.jpg --format webp
    python3 image-processor.py social photo.jpg --output social-sizes/
    python3 image-processor.py batch ./client-photos --output ./optimized --operation webp

Options:
    --size WIDTHxHEIGHT    Resize dimensions (default: 1080x1080)
    --format FORMAT        Output format (webp, jpg, png)
    --quality 0-100        Image quality (default: 85)
    --text TEXT            Watermark text
    --output PATH          Output file or directory
    --help                 Show this help message
"""
    print(help_text)

def main():
    """Main entry point"""
    if len(sys.argv) < 2 or '--help' in sys.argv or '-h' in sys.argv:
        show_help()
        return
    
    # Check dependencies
    deps = check_dependencies()
    if not deps['pillow']:
        print("\n⚠️  Installing Pillow...")
        print("Run: pip3 install Pillow")
        print("Or: pip3 install Pillow numpy opencv-python (for full features)")
        return
    
    command = sys.argv[1]
    
    # Parse arguments (simplified)
    args = {}
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
            if 'input' not in args:
                args['input'] = sys.argv[i]
            i += 1
    
    # Execute command
    if command == 'resize':
        size_str = args.get('size', '1080x1080')
        width, height = map(int, size_str.split('x'))
        output = args.get('output', 'resized.jpg')
        resize_image(args['input'], output, (width, height))
    
    elif command == 'convert':
        fmt = args.get('format', 'webp')
        quality = int(args.get('quality', 85))
        output = args.get('output', None)
        convert_format(args['input'], fmt, quality)
    
    elif command == 'enhance':
        output = args.get('output', 'enhanced.jpg')
        enhance_quality(args['input'], output)
    
    elif command == 'watermark':
        text = args.get('text', 'SocialDrive AI')
        output = args.get('output', 'watermarked.jpg')
        add_watermark(args['input'], output, text)
    
    elif command == 'social':
        output_dir = args.get('output', 'social-sizes')
        generate_social_sizes(args['input'], output_dir)
    
    elif command == 'batch':
        input_dir = args.get('input')
        output_dir = args.get('output', 'output')
        operation = args.get('operation', 'resize')
        process_batch(input_dir, output_dir, operation)
    
    else:
        print(f"❌ Unknown command: {command}")
        show_help()

if __name__ == '__main__':
    main()
