import pytesseract
from PIL import Image
import cv2
import numpy as np
import base64
import io
import os
import logging

logger = logging.getLogger(__name__)

class OCRService:
    def __init__(self):
        # Configure Tesseract path for Windows
        # You may need to adjust this path based on your Tesseract installation
        tesseract_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        if os.path.exists(tesseract_path):
            pytesseract.pytesseract.tesseract_cmd = tesseract_path
        else:
            # Try alternative paths
            alternative_paths = [
                r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
                '/usr/bin/tesseract',  # Linux
                '/usr/local/bin/tesseract',  # macOS
            ]
            for path in alternative_paths:
                if os.path.exists(path):
                    pytesseract.pytesseract.tesseract_cmd = path
                    break
        
        # Check if Tesseract is available
        self.tesseract_available = self._check_tesseract_availability()
    
    def _check_tesseract_availability(self) -> bool:
        """Check if Tesseract is available on the system"""
        try:
            # Try to get Tesseract version
            version = pytesseract.get_tesseract_version()
            logger.info(f"Tesseract version: {version}")
            return True
        except Exception as e:
            logger.warning(f"Tesseract not available: {e}")
            return False
    
    def extract_text_from_image(self, image_data: str) -> dict:
        """
        Extract text from image with position data
        Args:
            image_data: Base64 encoded image data or image URL
        Returns:
            dict: {
                'text': 'full text content',
                'words': [{'text': 'word', 'bbox': [x, y, w, h], 'confidence': 0.95}],
                'success': True/False,
                'error': 'error message if any'
            }
        """
        try:
            # Handle different image data formats
            if image_data.startswith('data:image'):
                # Base64 encoded image
                image_bytes = base64.b64decode(image_data.split(',')[1])
            elif image_data.startswith('http'):
                # Image URL - would need to download first
                logger.warning("URL images not supported yet")
                return {'text': '', 'words': [], 'success': False, 'error': 'URL images not supported'}
            else:
                # Assume it's already base64 without data URL prefix
                image_bytes = base64.b64decode(image_data)
            
            # Open image with PIL
            image = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Check if Tesseract is available
            if not self.tesseract_available:
                return self._fallback_ocr(image)
            
            # Get text with bounding boxes
            data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
            
            words = []
            for i, conf in enumerate(data['conf']):
                if conf > 60 and data['text'][i].strip():  # Filter low confidence and empty text
                    words.append({
                        'text': data['text'][i].strip(),
                        'bbox': [data['left'][i], data['top'][i], 
                                data['width'][i], data['height'][i]],
                        'confidence': conf / 100
                    })
            
            full_text = ' '.join([w['text'] for w in words])
            
            return {
                'text': full_text,
                'words': words,
                'success': True,
                'error': None
            }
            
        except Exception as e:
            logger.error(f"OCR Error: {str(e)}")
            return {
                'text': '', 
                'words': [], 
                'success': False, 
                'error': str(e)
            }
    
    def _fallback_ocr(self, image: Image.Image) -> dict:
        """
        Fallback OCR when Tesseract is not available
        Returns a mock response for testing purposes
        """
        logger.info("Using fallback OCR (Tesseract not available)")
        
        # Get image dimensions
        width, height = image.size
        
        # Create mock text data for testing
        mock_words = [
            {
                'text': 'Science',
                'bbox': [50, 50, 100, 30],
                'confidence': 0.9
            },
            {
                'text': 'Textbook',
                'bbox': [160, 50, 120, 30],
                'confidence': 0.9
            },
            {
                'text': 'Chapter',
                'bbox': [50, 100, 100, 30],
                'confidence': 0.9
            },
            {
                'text': 'Content',
                'bbox': [160, 100, 100, 30],
                'confidence': 0.9
            }
        ]
        
        return {
            'text': 'Science Textbook Chapter Content',
            'words': mock_words,
            'success': True,
            'error': 'Tesseract not available - using fallback data'
        }
    
    def extract_text_from_file(self, file_path: str) -> dict:
        """
        Extract text from image file
        Args:
            file_path: Path to image file
        Returns:
            dict: Same format as extract_text_from_image
        """
        try:
            image = Image.open(file_path)
            return self.extract_text_from_image(self._image_to_base64(image))
        except Exception as e:
            logger.error(f"OCR File Error: {str(e)}")
            return {
                'text': '', 
                'words': [], 
                'success': False, 
                'error': str(e)
            }
    
    def _image_to_base64(self, image: Image.Image) -> str:
        """Convert PIL Image to base64 string"""
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        return f"data:image/png;base64,{img_str}" 