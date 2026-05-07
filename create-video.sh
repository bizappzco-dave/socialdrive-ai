#!/bin/bash
# SocialDrive AI - Quick Video Creator
# Creates MP4 slideshow from images with FFmpeg

# Usage: ./create-video.sh output.mp4 image1.jpg image2.jpg image3.jpg ...

OUTPUT="$1"
shift
IMAGES=("$@")

if [ ${#IMAGES[@]} -lt 1 ]; then
    echo "❌ Usage: $0 output.mp4 image1.jpg image2.jpg ..."
    exit 1
fi

echo "Creating video from ${#IMAGES[@]} images..."
echo "Output: $OUTPUT"

# Create temporary file list
TEMP_LIST=$(mktemp)
for img in "${IMAGES[@]}"; do
    echo "file '$img'" >> "$TEMP_LIST"
    echo "duration 2" >> "$TEMP_LIST"  # 2 seconds per image
done
# Duplicate last frame
echo "file '${IMAGES[-1]}'" >> "$TEMP_LIST"

# Create video
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
    "$OUTPUT"

# Cleanup
rm "$TEMP_LIST"

echo ""
echo "✓ Video created: $OUTPUT"
echo "Duration: ${#IMAGES[@]} images × 2 seconds = $((${#IMAGES[@]} * 2)) seconds"

# Show file info
ls -lh "$OUTPUT"
