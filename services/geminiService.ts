// FIX: Create services/geminiService.ts to implement Gemini API calls.
import { GoogleGenAI, Type } from "@google/genai";
import { FormData, ProductImportData, GeminiAnalysisResponse } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const model = 'gemini-2.5-flash';

export async function getProductInfoFromUrl(url: string): Promise<ProductImportData> {
  const prompt = `
    Analyze the product page at the following URL and extract the requested information.
    URL: ${url}
    
    Provide the response in JSON format. Do not include any text before or after the JSON object.
    If a value cannot be found, use a reasonable default or null.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      category: { type: Type.STRING, description: 'Product category' },
      length: { type: Type.NUMBER, description: 'Product length in cm' },
      width: { type: Type.NUMBER, description: 'Product width in cm' },
      height: { type: Type.NUMBER, description: 'Product height in cm' },
      weight: { type: Type.NUMBER, description: 'Product weight in kg' },
      sellingPrice: { type: Type.NUMBER, description: 'Product selling price' },
      imageUrl: { type: Type.STRING, description: 'URL of the main product image' },
    },
    required: ['category', 'length', 'width', 'height', 'weight', 'sellingPrice', 'imageUrl'],
  };
  
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as ProductImportData;
  } catch (error) {
    console.error("Error fetching product info from Gemini:", error);
    throw new Error("Failed to extract product information from the URL. Please check the URL or try again.");
  }
}

export async function getFinancialAnalysis(formData: FormData): Promise<GeminiAnalysisResponse> {
    const prompt = `
    You are a senior e-commerce consultant specializing in the Brazilian market. Your task is to provide a professional, in-depth comparative analysis for selling a product on the top 3 Brazilian marketplaces: Mercado Livre, Amazon Brasil, and Magazine Luiza.

    Product and Financial Data:
    - Category: ${formData.category}
    - Dimensions (LxWxH cm): ${formData.length} x ${formData.width} x ${formData.height}
    - Weight (kg): ${formData.weight}
    - Selling Price (BRL): ${formData.sellingPrice}
    - Acquisition Cost (BRL): ${formData.acquisition}
    - Packaging Cost (BRL): ${formData.packagingCost}
    - Desired Profit Margin: ${formData.desiredProfitMargin}%
    - Destination State (Brazil): ${formData.state}
    - Destination CEP (Postal Code for shipping simulation): ${formData.destinationCep}

    Your analysis must be returned as a single JSON object with the following structure:

    1.  \`taxRate\`: Estimate the combined tax rate (ICMS, etc.) as a single decimal for this product and region.
    2.  \`packageSuggestion\`: Suggest an optimal package. Include:
        *   \`dimensions\`: The outer dimensions of the package (e.g., "30x20x5 cm").
        *   \`type\`: The recommended packaging type and material (e.g., "Caixa de papelão pardo", "Envelope de segurança com plástico-bolha").
        *   \`reason\`: A brief explanation for your choice, considering protection and shipping costs.
    3.  \`marketplaceComparison\`: An array of objects, one for each marketplace (Mercado Livre, Amazon Brasil, Magazine Luiza). Each object must contain:
        *   \`name\`: The marketplace name.
        *   \`feeRate\`: The estimated commission fee rate as a decimal for this category.
        *   \`shippingCost\`: The estimated shipping cost in BRL for this product on this platform, considering their logistics programs (Mercado Envios, Amazon FBA, etc.) for the destination CEP.
        *   \`shippingInfo\`: A brief explanation of their shipping program.
        *   \`pros\`: An array of strings listing the advantages of selling this product on this platform.
        *   \`cons\`: An array of strings listing the disadvantages.
    4.  \`strategicRecommendation\`: A detailed, conclusive recommendation on which marketplace is the best choice for this specific product, justifying your choice based on the analysis. Also, include optimistic, realistic, and pessimistic sales scenarios for the recommended marketplace, considering the desired profit margin.

    Provide ONLY the JSON object in your response. Be extremely detailed and professional in your explanations.
  `;

  const marketplaceDetailSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        feeRate: { type: Type.NUMBER },
        shippingCost: { type: Type.NUMBER },
        shippingInfo: { type: Type.STRING },
        pros: { type: Type.ARRAY, items: { type: Type.STRING } },
        cons: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ['name', 'feeRate', 'shippingCost', 'shippingInfo', 'pros', 'cons'],
  };

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      taxRate: { type: Type.NUMBER, description: 'Estimated total tax rate as a decimal (e.g., 0.18 for 18%)' },
      packageSuggestion: {
        type: Type.OBJECT,
        properties: {
          dimensions: { type: Type.STRING, description: 'Suggested package dimensions' },
          type: { type: Type.STRING, description: 'Suggested package type and material' },
          reason: { type: Type.STRING, description: 'Reason for the package suggestion' },
        },
        required: ['dimensions', 'type', 'reason']
      },
      marketplaceComparison: {
        type: Type.ARRAY,
        items: marketplaceDetailSchema,
      },
      strategicRecommendation: { type: Type.STRING, description: 'Strategic recommendation and scenario analysis.' },
    },
    required: ['taxRate', 'packageSuggestion', 'marketplaceComparison', 'strategicRecommendation'],
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as GeminiAnalysisResponse;
  } catch (error) {
    console.error("Error getting financial analysis from Gemini:", error);
    throw new Error("The AI failed to generate a financial analysis. Please check your input data or try again.");
  }
}