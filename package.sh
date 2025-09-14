#!/bin/bash

# Chrome Extension Packaging Script
# Creates a versioned zip file with checksums for Chrome Web Store submission

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Chrome Extension Packager${NC}"
echo "================================"

# Get version from manifest.json
VERSION=$(grep '"version"' manifest.json | sed 's/.*"version": "\([^"]*\)".*/\1/')
if [ -z "$VERSION" ]; then
    echo -e "${RED}Error: Could not extract version from manifest.json${NC}"
    exit 1
fi

echo -e "${BLUE}Version:${NC} $VERSION"

# Create build directory if it doesn't exist
BUILD_DIR="build"
mkdir -p "$BUILD_DIR"

# Generate filename with version and timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="ai-detector-extension-v${VERSION}-${TIMESTAMP}"
ZIP_FILE="${BUILD_DIR}/${FILENAME}.zip"

echo -e "${BLUE}Creating package:${NC} $ZIP_FILE"

# Files to include in the package
FILES_TO_INCLUDE=(
    "manifest.json"
    "content.js"
    "styles.css"
    "README.md"
)

# Verify all required files exist
echo -e "${BLUE}Checking required files...${NC}"
for file in "${FILES_TO_INCLUDE[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}Error: Required file '$file' not found${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} $file"
done

# Create the zip file
echo -e "${BLUE}Creating zip archive...${NC}"
zip -r "$ZIP_FILE" "${FILES_TO_INCLUDE[@]}" -x "*.git*" "*.DS_Store*" "build/*" "*.zip"

# Generate checksums
echo -e "${BLUE}Generating checksums...${NC}"
CHECKSUM_FILE="${BUILD_DIR}/${FILENAME}.checksums.txt"

# Generate multiple hash types
echo "# Checksums for $FILENAME.zip" > "$CHECKSUM_FILE"
echo "# Generated on $(date)" >> "$CHECKSUM_FILE"
echo "" >> "$CHECKSUM_FILE"

if command -v sha256sum >/dev/null 2>&1; then
    SHA256=$(sha256sum "$ZIP_FILE" | cut -d' ' -f1)
    echo "SHA256: $SHA256" >> "$CHECKSUM_FILE"
    echo -e "${GREEN}SHA256:${NC} $SHA256"
elif command -v shasum >/dev/null 2>&1; then
    SHA256=$(shasum -a 256 "$ZIP_FILE" | cut -d' ' -f1)
    echo "SHA256: $SHA256" >> "$CHECKSUM_FILE"
    echo -e "${GREEN}SHA256:${NC} $SHA256"
fi

if command -v md5sum >/dev/null 2>&1; then
    MD5=$(md5sum "$ZIP_FILE" | cut -d' ' -f1)
    echo "MD5: $MD5" >> "$CHECKSUM_FILE"
    echo -e "${GREEN}MD5:${NC} $MD5"
elif command -v md5 >/dev/null 2>&1; then
    MD5=$(md5 -q "$ZIP_FILE")
    echo "MD5: $MD5" >> "$CHECKSUM_FILE"
    echo -e "${GREEN}MD5:${NC} $MD5"
fi

# Get file size
FILE_SIZE=$(ls -lh "$ZIP_FILE" | awk '{print $5}')
echo "Size: $FILE_SIZE" >> "$CHECKSUM_FILE"
echo -e "${GREEN}Size:${NC} $FILE_SIZE"

# Create a simple manifest for this build
BUILD_MANIFEST="${BUILD_DIR}/${FILENAME}.build-info.json"
cat > "$BUILD_MANIFEST" << EOF
{
  "extension_name": "AI Detector: Em Dashes & Unicode Spaces Highlighter",
  "version": "$VERSION",
  "build_timestamp": "$TIMESTAMP",
  "build_date": "$(date -Iseconds)",
  "zip_filename": "$FILENAME.zip",
  "file_size": "$FILE_SIZE",
  "included_files": $(printf '%s\n' "${FILES_TO_INCLUDE[@]}" | jq -R . | jq -s .),
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')"
}
EOF

echo ""
echo -e "${GREEN}✓ Package created successfully!${NC}"
echo ""
echo -e "${YELLOW}Files created:${NC}"
echo -e "  📦 $ZIP_FILE"
echo -e "  🔒 $CHECKSUM_FILE"
echo -e "  📋 $BUILD_MANIFEST"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Test the extension by loading $ZIP_FILE in Chrome"
echo -e "  2. Upload $ZIP_FILE to Chrome Web Store"
echo -e "  3. Keep the checksums file for verification"
echo ""
echo -e "${BLUE}Chrome Web Store URL:${NC} https://chrome.google.com/webstore/devconsole"
