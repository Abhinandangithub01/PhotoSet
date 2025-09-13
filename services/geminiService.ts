import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { GenerateContentResponse, Part } from "@google/genai";
import { BACKGROUND_THEMES, LIGHTING_MOODS } from "../constants";
import type { StyleRecommendation } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function enhanceProductPhoto(
  base64ImageData: string,
  mimeType: string,
  backgroundTheme: string,
  lightingMood: string
): Promise<{ imageUrl: string; text: string }> {
  try {
    const prompt = `You are an expert AI photo editor specialized in product photography enhancement.
The user has uploaded a product photo that should remain the visual focal point.
Your task is to generate a professional-style product photoshoot image by:
1.  Seamlessly blending the product into a background theme described as: "${backgroundTheme}"
2.  Applying lighting and shadow effects described as: "${lightingMood}"
3.  Enhancing the product’s colors and details to make it pop without altering its natural appearance.
4.  Maintaining high resolution suitable for e-commerce presentation and social media.
5.  Composing the photo with visual balance, leaving clean space around the product for marketing overlays.
6.  Use a realistic photographic style unless the theme requests a more artistic or stylized look.
Apply these adjustments focused on the uploaded product image.
Generate a cohesive, market-ready product photo incorporating user preferences. Do not add any text or watermark to the generated image.`;

    const imagePart: Part = {
      inlineData: {
        data: base64ImageData,
        mimeType: mimeType,
      },
    };

    const textPart: Part = {
      text: prompt,
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [imagePart, textPart],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });
    
    let generatedImageUrl = '';
    let generatedText = 'No descriptive text was generated.';

    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        generatedText = part.text;
      } else if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        generatedImageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
    }

    if (!generatedImageUrl) {
      throw new Error("The AI did not return an image. Please try again.");
    }
    
    return { imageUrl: generatedImageUrl, text: generatedText };

  } catch (error) {
    console.error("Error enhancing photo:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during image generation.";
    throw new Error(`Failed to enhance photo: ${errorMessage}`);
  }
}


export async function getStyleRecommendation(
  base64ImageData: string,
  mimeType: string
): Promise<StyleRecommendation> {
  try {
    const prompt = `As a professional product photographer, analyze the following product image. Based on the product's characteristics (type, color, texture, likely target audience), suggest the optimal background and lighting.

    Choose one background theme from this list: ${BACKGROUND_THEMES.join(', ')}.
    Choose one lighting mood from this list: ${LIGHTING_MOODS.join(', ')}.

    Provide a brief reasoning for your choices, explaining why they would make the product more appealing for e-commerce.

    Return ONLY a valid JSON object with the keys "backgroundTheme", "lightingMood", and "reasoning".`;
    
    const imagePart: Part = {
      inlineData: {
        data: base64ImageData,
        mimeType: mimeType,
      },
    };

    const textPart: Part = {
      text: prompt,
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    backgroundTheme: { type: Type.STRING },
                    lightingMood: { type: Type.STRING },
                    reasoning: { type: Type.STRING },
                },
                required: ["backgroundTheme", "lightingMood", "reasoning"],
            },
        },
    });

    const jsonStr = response.text.trim();
    const recommendation = JSON.parse(jsonStr) as StyleRecommendation;

    if (!BACKGROUND_THEMES.includes(recommendation.backgroundTheme) || !LIGHTING_MOODS.includes(recommendation.lightingMood)) {
        console.warn("AI returned values not in the predefined lists.", recommendation);
    }

    return recommendation;
  } catch (error) {
    console.error("Error getting style recommendation:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while getting recommendations.";
    throw new Error(`Failed to get style recommendation: ${errorMessage}`);
  }
}
