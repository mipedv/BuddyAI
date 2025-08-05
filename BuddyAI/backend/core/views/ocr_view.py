from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from ..services.ocr_service import OCRService
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def extract_text_from_image(request):
    """
    Extract text from image using OCR
    POST /api/ocr/extract-text/
    
    Request body:
    {
        "image": "base64_encoded_image_data",
        "image_url": "optional_image_url"
    }
    
    Response:
    {
        "success": true,
        "text": "extracted text content",
        "words": [
            {
                "text": "word",
                "bbox": [x, y, width, height],
                "confidence": 0.95
            }
        ],
        "error": null
    }
    """
    try:
        # Get image data from request
        image_data = request.data.get('image')
        image_url = request.data.get('image_url')
        
        if not image_data and not image_url:
            return Response({
                'success': False,
                'error': 'No image data or URL provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Initialize OCR service
        ocr_service = OCRService()
        
        # Process image
        if image_data:
            result = ocr_service.extract_text_from_image(image_data)
        else:
            # For URL images, we'd need to download first
            # For now, return error
            return Response({
                'success': False,
                'error': 'URL images not supported yet'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(result)
        
    except Exception as e:
        logger.error(f"OCR API Error: {str(e)}")
        return Response({
            'success': False,
            'error': f'OCR processing failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def extract_text_from_file(request):
    """
    Extract text from uploaded image file
    POST /api/ocr/extract-file/
    
    Request: multipart/form-data with image file
    """
    try:
        if 'file' not in request.FILES:
            return Response({
                'success': False,
                'error': 'No file uploaded'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        uploaded_file = request.FILES['file']
        
        # Check if it's an image
        if not uploaded_file.content_type.startswith('image/'):
            return Response({
                'success': False,
                'error': 'Uploaded file is not an image'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Initialize OCR service
        ocr_service = OCRService()
        
        # Convert file to base64 and process
        import base64
        file_content = uploaded_file.read()
        image_data = f"data:{uploaded_file.content_type};base64,{base64.b64encode(file_content).decode()}"
        
        result = ocr_service.extract_text_from_image(image_data)
        
        return Response(result)
        
    except Exception as e:
        logger.error(f"OCR File API Error: {str(e)}")
        return Response({
            'success': False,
            'error': f'OCR processing failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 