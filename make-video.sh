#!/bin/bash
# SocialDrive AI - Create Video from Images
# Usage: ./make-video.sh output.mp4 image1.jpg image2.jpg image3.jpg ...

OUTPUT="$1"
shift

if [ -z "$OUTPUT" ] || [ $# -lt 1 ]; then
    echo "❌ Usage: $0 output.mp4 image1.jpg [image2.jpg] [image3.jpg] ..."
    echo ""
    echo "Example:"
    echo "  $0 slideshow.mp4 img1.jpg img2.jpg img3.jpg"
    echo "  $0 instagram.mp4 *.jpg"
    exit 1
fi

# Create temporary file list
TEMP_LIST=$(mktemp)

# Add each image to the list (2 seconds each)
for img in "$@"; do
    # Get absolute path
    ABS_PATH=$(realpath "$img")
    echo "file '$ABS_PATH'" >> "$TEMP_LIST"
    echo "duration 2" >> "$TEMP_LIST"
done

# Duplicate last frame (required by ffmpeg)
LAST_IMG=$(realpath "${!#}")
echo "file '$LAST_IMG'" >> "$TEMP_LIST"

echo "🎬 Creating video from $@ images..."
echo "Output: $OUTPUT"
echo ""

# Create video with FFmpeg
ffmpeg -y \
    -f concat \
    -safe 0 \
    -i "$TEMP_LIST" \
    -vf "scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2" \
    -c:v libx264 \
    -pix_fmt yuv420p \
    -r 30 \
    -preset medium \
    -crf 23 \
    "$OUTPUT" 2>&1 | tail -5

# Cleanup
rm "$TEMP_LIST"

echo ""
echo "✅ Video created: $OUTPUT"
echo "📊 File size: $(ls -lh "$OUTPUT" | awk '{print $5}')"
echo "⏱️  Duration: $(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUTPUT") seconds"
