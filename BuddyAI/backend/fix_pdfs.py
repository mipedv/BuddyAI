#!/usr/bin/env python3
"""
PDF Conversion Script for BuddyAI Textbook Images
This script converts PNG images to properly structured PDF files
"""

from PIL import Image
import os
import sys

def convert_images_to_pdf(input_folder, output_folder):
    """
    Convert PNG images to properly structured PDF files
    """
    
    # Ensure output folder exists
    os.makedirs(output_folder, exist_ok=True)
    
    # Find all PNG files in the input folder
    png_files = []
    for filename in os.listdir(input_folder):
        if filename.lower().endswith('.png'):
            png_files.append(filename)
    
    png_files.sort()  # Sort to maintain order
    
    if not png_files:
        print("No PNG files found in the input folder!")
        return
    
    print(f"Found {len(png_files)} PNG files: {png_files}")
    
    # Group files by chapter (assuming naming pattern like "solar system_1.png", "solar system_2.png")
    chapters = {}
    for filename in png_files:
        # Extract chapter name (everything before the last underscore and page number)
        if '_' in filename:
            chapter_name = '_'.join(filename.split('_')[:-1])
            page_num = filename.split('_')[-1].split('.')[0]
        else:
            chapter_name = filename.split('.')[0]
            page_num = "1"
        
        if chapter_name not in chapters:
            chapters[chapter_name] = []
        chapters[chapter_name].append((filename, int(page_num)))
    
    # Convert each chapter to PDF
    for chapter_name, pages in chapters.items():
        # Sort pages by page number
        pages.sort(key=lambda x: x[1])
        
        print(f"\nProcessing chapter: {chapter_name}")
        images = []
        
        for filename, page_num in pages:
            img_path = os.path.join(input_folder, filename)
            print(f"  Loading page {page_num}: {filename}")
            
            try:
                # Open and process image
                img = Image.open(img_path)
                
                # Convert to RGB if necessary
                if img.mode != 'RGB':
                    print(f"    Converting {img.mode} to RGB")
                    img = img.convert('RGB')
                
                # Resize if too large (optional, for better performance)
                max_size = (2000, 2000)
                if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
                    print(f"    Resizing from {img.size} to fit {max_size}")
                    img.thumbnail(max_size, Image.Resampling.LANCZOS)
                
                images.append(img)
                
            except Exception as e:
                print(f"    Error processing {filename}: {e}")
                continue
        
        if images:
            # Create PDF filename (replace spaces with + for web compatibility)
            pdf_filename = f"{chapter_name.replace(' ', '+')}_1.pdf"
            pdf_path = os.path.join(output_folder, pdf_filename)
            
            try:
                # Save as PDF with proper settings
                images[0].save(
                    pdf_path,
                    save_all=True,
                    append_images=images[1:] if len(images) > 1 else [],
                    format='PDF',
                    resolution=150.0,  # Good balance of quality and size
                    quality=85,        # Good compression
                    optimize=True      # Optimize file size
                )
                
                file_size = os.path.getsize(pdf_path) / 1024 / 1024  # Size in MB
                print(f"  ✅ Created: {pdf_filename} ({file_size:.2f} MB, {len(images)} pages)")
                
            except Exception as e:
                print(f"  ❌ Error creating PDF {pdf_filename}: {e}")
        else:
            print(f"  ⚠️ No valid images found for chapter: {chapter_name}")

def main():
    # Default paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(script_dir))  # Go up two levels
    
    input_folder = os.path.join(project_root, "BuddyAI", "frontend", "public", "media", "textbook-chapters")
    output_folder = input_folder  # Same folder
    
    print("🔧 BuddyAI PDF Conversion Tool")
    print("=" * 50)
    print(f"Input folder: {input_folder}")
    print(f"Output folder: {output_folder}")
    print()
    
    # Check if input folder exists
    if not os.path.exists(input_folder):
        print(f"❌ Input folder does not exist: {input_folder}")
        return
    
    # Run conversion
    convert_images_to_pdf(input_folder, output_folder)
    print("\n✅ Conversion completed!")
    print("\nNext steps:")
    print("1. Check the generated PDF files")
    print("2. Test them in the BuddyAI application")
    print("3. Delete the old PNG files if PDFs work correctly")

if __name__ == "__main__":
    main()