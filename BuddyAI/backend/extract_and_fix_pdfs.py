#!/usr/bin/env python3
"""
Extract images from existing PDFs and recreate them with proper structure
"""

import fitz  # PyMuPDF
from PIL import Image
import os
import io

def extract_images_from_pdf(pdf_path):
    """Extract images from PDF and return as PIL Images"""
    images = []
    
    try:
        # Open PDF
        pdf_document = fitz.open(pdf_path)
        
        for page_num in range(len(pdf_document)):
            page = pdf_document[page_num]
            
            # Get page as image
            mat = fitz.Matrix(2.0, 2.0)  # High resolution
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("png")
            
            # Convert to PIL Image
            img = Image.open(io.BytesIO(img_data))
            images.append(img)
            
            print(f"  Extracted page {page_num + 1}: {img.size}")
        
        pdf_document.close()
        return images
        
    except Exception as e:
        print(f"Error extracting from PDF: {e}")
        return []

def recreate_pdf(images, output_path):
    """Recreate PDF with proper structure"""
    if not images:
        return False
    
    try:
        # Save as properly structured PDF
        images[0].save(
            output_path,
            save_all=True,
            append_images=images[1:] if len(images) > 1 else [],
            format='PDF',
            resolution=150.0,
            quality=90,
            optimize=True
        )
        return True
    except Exception as e:
        print(f"Error creating PDF: {e}")
        return False

def main():
    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(script_dir))  # Go up two levels
    chapters_folder = os.path.join(project_root, "BuddyAI", "frontend", "public", "media", "textbook-chapters")
    
    print("🔧 BuddyAI PDF Repair Tool")
    print("=" * 50)
    
    # Find existing PDF files
    pdf_files = [f for f in os.listdir(chapters_folder) if f.endswith('.pdf')]
    
    if not pdf_files:
        print("No PDF files found!")
        return
    
    print(f"Found PDF files: {pdf_files}")
    
    for pdf_file in pdf_files:
        pdf_path = os.path.join(chapters_folder, pdf_file)
        backup_path = os.path.join(chapters_folder, f"backup_{pdf_file}")
        
        print(f"\nProcessing: {pdf_file}")
        
        # Create backup
        import shutil
        shutil.copy2(pdf_path, backup_path)
        print(f"  Created backup: backup_{pdf_file}")
        
        # Extract images
        print("  Extracting images...")
        images = extract_images_from_pdf(pdf_path)
        
        if images:
            # Recreate PDF
            print("  Recreating PDF with proper structure...")
            success = recreate_pdf(images, pdf_path)
            
            if success:
                file_size = os.path.getsize(pdf_path) / 1024 / 1024
                print(f"  ✅ Fixed: {pdf_file} ({file_size:.2f} MB, {len(images)} pages)")
            else:
                print(f"  ❌ Failed to recreate: {pdf_file}")
                # Restore backup
                shutil.copy2(backup_path, pdf_path)
        else:
            print(f"  ❌ Failed to extract images from: {pdf_file}")

if __name__ == "__main__":
    main()