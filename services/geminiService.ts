import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeminiResponseItem } from "../types";

const MAX_IMAGES_PER_REQUEST = 10;

// Helper to convert file to base64
const fileToPart = (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const processImageBatch = async (files: File[]): Promise<GeminiResponseItem[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Prepare image parts
  const imageParts = await Promise.all(files.map(fileToPart));

  const promptText = `
    Analyze these ${files.length} images in order. 
    For each image:
    1. Extract the specific GPS coordinates if they are visible text within the image (e.g., stamped by a GPS camera app). 
    2. If no coordinates are written in the text, try to estimate the coordinates based on the location/landmark shown. 
    3. Identify the likely street address or location name.
    4. Extract the date and time of the photo if visible (e.g., timestamp watermark). Format date as YYYY-MM-DD and time as HH:mm if possible.
    
    Return an array of objects, strictly one object per image, preserving the order of the input images.
    If you cannot determine location, return null for lat/lng but provide a description in the address field.
    If date/time is not found, return empty strings for those fields.
  `;

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        address: { type: Type.STRING, description: "The extracted or estimated address/location name." },
        latitude: { type: Type.NUMBER, description: "Latitude in decimal degrees (e.g., -6.2088). Use negative for South." },
        longitude: { type: Type.NUMBER, description: "Longitude in decimal degrees (e.g., 106.8456). Use negative for West." },
        foundCoordinates: { type: Type.BOOLEAN, description: "True if specific coordinates were found/extracted, false if unknown." },
        date: { type: Type.STRING, description: "Date found on image (YYYY-MM-DD) or empty string" },
        time: { type: Type.STRING, description: "Time found on image (HH:mm) or empty string" }
      },
      required: ["address", "latitude", "longitude", "foundCoordinates", "date", "time"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Flash is efficient for batch image processing
      contents: {
        parts: [
          ...imageParts,
          { text: promptText }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2 // Low temperature for factual extraction
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      // Ensure we return an array of the same length, filling gaps if necessary
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    
    // Fallback if parsing fails or structure is wrong
    return files.map(() => ({ 
      address: "Could not process", 
      latitude: 0, 
      longitude: 0, 
      foundCoordinates: false,
      date: "",
      time: ""
    }));

  } catch (error) {
    console.error("Gemini Batch Error:", error);
    // Return error placeholders so the whole batch doesn't fail silently
    return files.map(() => ({ 
      address: "Error processing image", 
      latitude: 0, 
      longitude: 0, 
      foundCoordinates: false,
      date: "",
      time: ""
    }));
  }
};