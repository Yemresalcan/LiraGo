import { OCRResult } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * OCR Service
 *
 * This service provides OCR (Optical Character Recognition) functionality
 * to extract text from receipt images.
 *
 * Currently supports:
 * - Google Gemini API
 * - Mock OCR for development
 *
 * To use Google Gemini:
 * 1. Get an API key from Google AI Studio
 * 2. Add the API key to your .env file as EXPO_PUBLIC_GEMINI_API_KEY
 */

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const USE_MOCK_OCR = !GEMINI_API_KEY;

// Initialize Gemini
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

/**
 * Extract text and data from an image using Google Gemini
 */
async function extractTextWithGemini(imageUri: string): Promise<OCRResult> {
  try {
    if (!genAI) throw new Error('Gemini API Key not found');

    // Convert image to base64
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);
    const base64Data = base64.split(',')[1];

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const prompt = `Analyze this image. It is likely a utility bill (electricity, water, gas, etc.) or a receipt. 
    Extract the following information in JSON format:
    {
      "text": "The full text content of the bill",
      "merchant": "The merchant or provider name",
      "date": "The 'Last Payment Date' (Son Ödeme Tarihi) of the bill in YYYY-MM-DD format. If not found, use the bill date.",
      "total": 0.00,
      "billType": "electricity" | "water" | "gas" | "internet" | "other",
      "usage": 0.00,
      "usageUnit": "kWh" | "m3" | null,
      "items": "A brief list or summary of items purchased (e.g. 'Süt, Ekmek, Yumurta' or 'İki kişilik akşam yemeği'). If it's a utility bill, describe the service period. MUST BE IN TURKISH.",
      "description": "A short description of the expense (e.g. 'Market alışverişi', 'Restoranda yemek', 'Elektrik Faturası'). MUST BE IN TURKISH."
    }
    
    Specific instructions for 'usage':
    - For ELECTRICITY bills: Extract the 'Average Daily Consumption' (Günlük Ortalama Tüketim) value. Do NOT extract the total monthly consumption.
    - For WATER/GAS bills: Continue to extract the 'Total Consumption' (Toplam Tüketim/Sarfiyat).
    - Look for values associated with 'kWh', 'm3', 'Günlük Ortalama', 'Daily Average'.
    - Return the number as a float (e.g. 120.50). Handle Turkish number formatting (1.234,56 -> 1234.56) correctly.
    
    If a field is not found, use null. Return ONLY the JSON string, no markdown formatting. Ensure all text fields (items, description) are in TURKISH language.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const responseText = result.response.text();
    console.log('Gemini Response:', responseText);

    // Clean up response if it contains markdown code blocks
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonStr);

    let usage = data.usage;
    let cost = data.total;

    // Fallback: If Gemini missed usage or cost, try regex on the full text
    if (!usage || !cost) {
      const fallbackData = extractBillData(data.text || responseText, data.billType || 'electricity');
      if (!usage && fallbackData.usage) {
        console.log('Gemini missed usage, using fallback:', fallbackData.usage);
        usage = fallbackData.usage;
      }
      if (!cost && fallbackData.cost) {
        console.log('Gemini missed cost, using fallback:', fallbackData.cost);
        cost = fallbackData.cost;
      }
    }

    return {
      text: data.text || '',
      confidence: 0.9,
      extractedData: {
        amount: cost,
        date: data.date ? new Date(data.date) : undefined,
        merchant: data.merchant,
      },
      billData: {
        type: data.billType === 'other' ? undefined : data.billType,
        usage: usage,
        cost: cost,
        items: data.items,
        description: data.description,
      }
    };

  } catch (error) {
    console.error('Gemini OCR Error:', error);
    // Fallback to empty result or throw
    throw new Error('Failed to extract text with Gemini');
  }
}

/**
 * Mock OCR for development
 */
async function mockOCR(imageUri: string): Promise<OCRResult> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Randomly select between grocery and electricity bill for demo purposes
  const isElectricity = Math.random() > 0.5;

  if (isElectricity) {
    const mockBillText = `ENERJISA
    Musteri Hizmetleri: 444 4 372
    
    Fatura Tarihi: ${new Date().toLocaleDateString()}
    Son Odeme Tarihi: ${new Date(Date.now() + 864000000).toLocaleDateString()}
    
    Tuketim Detayi:
    Ilk Endeks: 12500.000 kWh
    Son Endeks: 12750.000 kWh
    Tuketim: 250.000 kWh
    
    Bedeller:
    Enerji Bedeli: 450.00 TL
    Dagitim Bedeli: 150.00 TL
    Vergiler: 100.00 TL
    
    ODENECEK TUTAR: 700.00 TL
    
    Tesekkurler.`;

    return {
      text: mockBillText,
      confidence: 0.99,
      extractedData: {
        amount: 700.00,
        date: new Date(),
        merchant: 'ENERJISA',
      },
      billData: {
        type: 'electricity',
        usage: 250.00,
        cost: 700.00,
      }
    };
  }

  const mockText = `GROCERY STORE
123 Main Street
City, State 12345

Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

Items:
Milk                $3.99
Bread               $2.49
Eggs                $4.99
Coffee              $8.99

Subtotal:          $20.46
Tax:                $1.84
Total:             $22.30

Payment: Credit Card
Card ending in 1234

Thank you for shopping!`;

  return {
    text: mockText,
    confidence: 0.98,
    extractedData: {
      amount: 22.30,
      date: new Date(),
      merchant: 'GROCERY STORE',
    },
  };
}

/**
 * Convert blob to base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Main OCR function
 */
export async function extractTextFromImage(imageUri: string): Promise<OCRResult> {
  if (USE_MOCK_OCR) {
    console.log('Using mock OCR (Gemini API key not found)');
    return mockOCR(imageUri);
  }

  return extractTextWithGemini(imageUri);
}

/**
 * Detect bill type from text (Legacy/Fallback)
 */
export function detectBillType(text: string): 'electricity' | 'water' | 'gas' | null {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('electricity') || lowerText.includes('kwh') || lowerText.includes('energy')) {
    return 'electricity';
  }

  if (lowerText.includes('water') || lowerText.includes('m3') || lowerText.includes('sewer')) {
    return 'water';
  }

  if (lowerText.includes('gas') || lowerText.includes('natural gas')) {
    return 'gas';
  }
  return null;
}

/**
 * Helper to parse Turkish number format (e.g. 1.234,56 -> 1234.56)
 */
function parseTurkishNumber(value: string): number {
  if (!value) return 0;
  // Remove thousands separators (dots) and replace decimal separator (comma) with dot
  const cleanValue = value.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleanValue);
}

/**
 * Extract bill specific data (Legacy/Fallback)
 */
export function extractBillData(text: string, type: 'electricity' | 'water' | 'gas'): { usage?: number; cost?: number } {
  const result: { usage?: number; cost?: number } = {};

  // Extract cost
  const costPatterns = [
    /odenecek tutar[:\s]*([\d\.,]+)/i,
    /toplam tutar[:\s]*([\d\.,]+)/i,
    /genel toplam[:\s]*([\d\.,]+)/i,
    /total[:\s]*\$?([\d\.,]+)/i,
    /amount due[:\s]*\$?([\d\.,]+)/i,
    /\$([\d\.,]+)/,
  ];

  for (const pattern of costPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const cost = parseTurkishNumber(match[1]);
      if (!isNaN(cost)) {
        result.cost = cost;
        break;
      }
    }
  }

  // Extract usage based on type
  if (type === 'electricity') {
    const kwhPatterns = [
      /gunluk\s*ortalama\s*tuketim[:\s]*([\d\.,]+)/i,
      /günlük\s*ortalama\s*tüketim[:\s]*([\d\.,]+)/i,
      /ort\.\s*tuketim[:\s]*([\d\.,]+)/i,
      /ort\.\s*tüketim[:\s]*([\d\.,]+)/i,
      /gunluk\s*ort\.[:\s]*([\d\.,]+)/i,
      /günlük\s*ort\.[:\s]*([\d\.,]+)/i,
      /daily\s*average[:\s]*([\d\.,]+)/i,
    ];

    for (const pattern of kwhPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const usage = parseTurkishNumber(match[1]);
        if (!isNaN(usage)) {
          result.usage = usage;
          break;
        }
      }
    }
  } else if (type === 'water' || type === 'gas') {
    const volPatterns = [
      /toplam\s*tuketim[:\s]*([\d\.,]+)/i,
      /toplam\s*tüketim[:\s]*([\d\.,]+)/i,
      /sarfiyat[:\s]*([\d\.,]+)/i,
      /tuketim[:\s]*([\d\.,]+)/i,
      /tüketim[:\s]*([\d\.,]+)/i,
      /([\d\.,]+)\s*m3/i,
    ];

    for (const pattern of volPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const usage = parseTurkishNumber(match[1]);
        if (!isNaN(usage)) {
          result.usage = usage;
          break;
        }
      }
    }
  }

  return result;
}
