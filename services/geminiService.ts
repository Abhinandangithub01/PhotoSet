import { GoogleGenAI, Modality, Type } from '@google/genai';
import type { MarketingCopy, CampaignPlan } from '../types';

// FIX: Initialize the GoogleGenAI client according to SDK guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface ImageData {
  base64: string;
  mimeType: string;
}

// FIX: Implement the function to generate an enhanced image using the Gemini 'gemini-2.5-flash-image-preview' model.
export const generateEnhancedImage = async (
  originalImage: ImageData,
  prompt: string,
  backgroundImage?: ImageData
): Promise<string> => {
  const model = 'gemini-2.5-flash-image-preview';

  const parts: any[] = [
    {
      inlineData: {
        data: originalImage.base64,
        mimeType: originalImage.mimeType,
      },
    },
    { text: `Edit the product photo with the following instructions: ${prompt}` },
  ];

  if (backgroundImage) {
    parts.push({ text: "Use this image as the new background:" });
    parts.push({
      inlineData: {
        data: backgroundImage.base64,
        mimeType: backgroundImage.mimeType,
      },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    const refusalText = response.text?.trim();
    if (refusalText) {
      throw new Error(`Image generation failed. Model responded: ${refusalText}`);
    }

    throw new Error('No image was generated. The model may have refused the request for safety reasons.');

  } catch (error) {
    console.error('Error generating enhanced image:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred during image generation.';
    throw new Error(`Failed to generate image. Reason: ${message}`);
  }
};

// FIX: Implement the function to suggest a scene using the Gemini 'gemini-2.5-flash' model.
export const generateSceneSuggestion = async (base64: string, mimeType: string): Promise<string> => {
  const model = 'gemini-2.5-flash';
  const prompt = 'Analyze the product in this image and suggest a creative and compelling scene description for a professional product photoshoot. The description should be concise, under 25 words, and suitable for a generative AI prompt. For example: "A rustic wooden table with scattered coffee beans and a soft morning light."';

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType } },
          { text: prompt },
        ],
      },
    });

    return response.text.trim().replace(/"/g, ''); // Remove quotes from response
  } catch (error) {
    console.error('Error generating scene suggestion:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    throw new Error(`Failed to get suggestion. Reason: ${message}`);
  }
};

// FIX: Implement the function to generate marketing copy using the Gemini 'gemini-2.5-flash' model with a JSON schema.
export const generateMarketingCopy = async (base64: string, mimeType: string): Promise<MarketingCopy> => {
  const model = 'gemini-2.5-flash';
  const prompt = 'Analyze the product in this image. Generate marketing copy for a social media post. Provide 3 catchy headlines, 2 descriptive body paragraphs, and an array of 5 relevant hashtags (without the # symbol).';

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headlines: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Three catchy headlines for the product.'
            },
            body: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Two descriptive body paragraphs about the product.'
            },
            hashtags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'An array of five relevant hashtags, without the # symbol.'
            },
          },
          required: ["headlines", "body", "hashtags"],
        },
      },
    });
    
    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);
    
    if (parsed.hashtags && Array.isArray(parsed.hashtags)) {
        parsed.hashtags = parsed.hashtags.map((h: string) => h.startsWith('#') ? h : `#${h}`);
    }

    return parsed as MarketingCopy;
  } catch (error) {
    console.error('Error generating marketing copy:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    throw new Error(`Failed to generate copy. Reason: ${message}`);
  }
};


export const generateSocialPostImage = async (
  productImage: ImageData,
  promoText: string,
  style: string
): Promise<string> => {
  const model = 'gemini-2.5-flash-image-preview';
  const prompt = `You are a professional graphic designer. Your task is to create a social media ad.
  Take the provided product image and artistically integrate the following promotional text onto it: "${promoText}".
  The design should follow a "${style}" theme.
  The text must be added as a graphical element, not just plain text.
  The final output should be a visually appealing and professional-looking advertisement. Do not add any text explaining your work, only output the final image.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              data: productImage.base64,
              mimeType: productImage.mimeType,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    const refusalText = response.text?.trim();
    if (refusalText) {
      throw new Error(`Image generation failed. Model responded: ${refusalText}`);
    }

    throw new Error('No image was generated. The model may have refused the request for safety reasons.');

  } catch (error) {
    console.error('Error generating social post image:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred during image generation.';
    throw new Error(`Failed to generate social post. Reason: ${message}`);
  }
};

export const generateCampaignPlan = async (productImage: ImageData, goal: string): Promise<CampaignPlan> => {
  const model = 'gemini-2.5-flash';
  const prompt = `You are an expert social media marketing strategist. Analyze the product in the image and generate a complete 7-day social media campaign plan with the goal of "${goal}". For each day, provide a creative theme, an engaging caption, an array of 5 relevant hashtags (without the #), and a clear call to action.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { data: productImage.base64, mimeType: productImage.mimeType } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.INTEGER, description: "The day number of the campaign (1-7)." },
              theme: { type: Type.STRING, description: "The creative theme for the day's post." },
              caption: { type: Type.STRING, description: "The full, engaging caption for the social media post." },
              hashtags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "An array of 5 relevant hashtags, without the # symbol."
              },
              callToAction: { type: Type.STRING, description: "The clear call to action for the post." },
            },
            required: ["day", "theme", "caption", "hashtags", "callToAction"],
          },
        },
      },
    });

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText) as CampaignPlan;
    
    // Ensure hashtags have the '#' prefix
    return parsed.map(day => ({
        ...day,
        hashtags: day.hashtags.map((h: string) => h.startsWith('#') ? h : `#${h}`)
    }));
    
  } catch (error) {
    console.error('Error generating campaign plan:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    throw new Error(`Failed to generate campaign plan. Reason: ${message}`);
  }
};