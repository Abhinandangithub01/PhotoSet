import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { MarketingCopy, UploadedImage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export async function generateEnhancedImage(
  originalImage: { base64: string; mimeType: string },
  prompt: string,
  customBackground?: { base64: string; mimeType: string }
): Promise<string> {
  const model = 'gemini-2.5-flash-image-preview';

  const parts: ({ text: string } | { inlineData: { data: string, mimeType: string }})[] = [
    {
      inlineData: {
        data: originalImage.base64,
        mimeType: originalImage.mimeType,
      },
    }
  ];

  let fullPrompt: string;

  if (customBackground) {
    parts.push({
        inlineData: {
            data: customBackground.base64,
            mimeType: customBackground.mimeType,
        },
    });
    fullPrompt = `You are an expert AI photo editor. Seamlessly blend the first image (the product) into the second image (the background). The product should be the main visual focus. Apply lighting and shadow effects described as: "${prompt}". Enhance the product’s colors and details to make it pop without altering its natural appearance. The final result should be a single, cohesive, photorealistic image.`;
  } else {
    fullPrompt = `Given the product image, place it in a photorealistic scene based on the following description: "${prompt}". The final image should be a high-quality, professional product shot. Do not add any text or logos. Focus on realistic composition, lighting, and shadows.`;
  }

  parts.push({ text: fullPrompt });

  const response = await ai.models.generateContent({
    model: model,
    contents: { parts },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  for (const candidate of response.candidates) {
      for (const part of candidate.content.parts) {
          if (part.inlineData) {
              return part.inlineData.data;
          }
      }
  }

  throw new Error("No image was generated. The model may have refused the request.");
}

export async function generateSceneSuggestion(
  base64: string,
  mimeType: string
): Promise<string> {
  const model = 'gemini-2.5-flash';
  const prompt = "You are a professional product photographer and food stylist. Analyze the product in this image. Suggest a single, descriptive scene composition for a product photoshoot. The suggestion should include relevant background elements and complementary props. For example, for potato chips, suggest 'A rustic wooden table with scattered whole potatoes and fresh spices'. Respond with only the descriptive sentence.";

  const imagePart = {
    inlineData: {
      data: base64,
      mimeType: mimeType,
    },
  };
  const textPart = { text: prompt };

  const response = await ai.models.generateContent({
    model,
    contents: { parts: [imagePart, textPart] },
  });

  return response.text.trim();
}


export async function generateMarketingCopy(
  base64: string,
  mimeType: string
): Promise<MarketingCopy> {
  const model = 'gemini-2.5-flash';

  const prompt = "Analyze the product in this image and generate compelling marketing copy. Provide three short, catchy headlines, a descriptive body paragraph (2-3 sentences), and a list of 5-7 relevant social media hashtags.";

  const imagePart = {
    inlineData: {
      data: base64,
      mimeType: mimeType,
    },
  };

  const textPart = { text: prompt };

  const copySchema = {
    type: Type.OBJECT,
    properties: {
      headlines: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Three short, catchy headlines for the product."
      },
      body: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "A descriptive body paragraph (2-3 sentences) for the product."
      },
      hashtags: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "A list of 5-7 relevant social media hashtags, without the '#' symbol."
      },
    },
    required: ["headlines", "body", "hashtags"],
  };

  const response = await ai.models.generateContent({
    model: model,
    contents: { parts: [imagePart, textPart] },
    config: {
      responseMimeType: 'application/json',
      responseSchema: copySchema,
    },
  });

  const jsonText = response.text.trim();
  try {
    const parsed = JSON.parse(jsonText);
    if (parsed.hashtags && Array.isArray(parsed.hashtags)) {
        parsed.hashtags = parsed.hashtags
            .flatMap((h: string) => h.split(' '))
            .map((h: string) => `#${h.replace(/#/g, '')}`)
            .filter((h: string) => h.length > 1);
    }
    return parsed;
  } catch (e) {
    console.error("Failed to parse JSON response from Gemini:", jsonText);
    throw new Error("The AI returned an invalid response. Please try again.");
  }
}