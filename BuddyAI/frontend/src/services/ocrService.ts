interface OCRWord {
  text: string;
  bbox: [number, number, number, number]; // [x, y, width, height]
  confidence: number;
}

interface OCRResponse {
  success: boolean;
  text: string;
  words: OCRWord[];
  error?: string;
}

class OCRService {
  private static baseURL = 'http://localhost:8000/api';

  /**
   * Extract text from image using backend OCR
   * @param imageData - Base64 encoded image data
   * @returns Promise<OCRResponse>
   */
  static async extractTextFromImage(imageData: string): Promise<OCRResponse> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${this.baseURL}/ocr/extract-text/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          image: imageData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result: OCRResponse = await response.json();
      return result;
    } catch (error) {
      console.error('OCR Service Error:', error);
      return {
        success: false,
        text: '',
        words: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Extract text from image file
   * @param file - Image file to process
   * @returns Promise<OCRResponse>
   */
  static async extractTextFromFile(file: File): Promise<OCRResponse> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseURL}/ocr/extract-file/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result: OCRResponse = await response.json();
      return result;
    } catch (error) {
      console.error('OCR File Service Error:', error);
      return {
        success: false,
        text: '',
        words: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Convert image element to base64
   * @param imgElement - HTML image element
   * @returns Promise<string> - Base64 encoded image data
   */
  static async imageToBase64(imgElement: HTMLImageElement): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Set canvas size to image size
      canvas.width = imgElement.naturalWidth;
      canvas.height = imgElement.naturalHeight;

      // Draw image to canvas
      ctx.drawImage(imgElement, 0, 0);

      // Convert to base64
      try {
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Check if OCR service is available
   * @returns Promise<boolean>
   */
  static async isServiceAvailable(): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const response = await fetch(`${this.baseURL}/health/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('OCR Service Availability Check Error:', error);
      return false;
    }
  }
}

export default OCRService;
export type { OCRResponse, OCRWord }; 