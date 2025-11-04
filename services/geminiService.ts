// FIX: Create services/geminiService.ts to implement Gemini API calls.
import { GoogleGenAI, Type } from "@google/genai";
import { FormData, ProductImportData, GeminiAnalysisResponse } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const model = 'gemini-2.5-flash';

export async function autofillProductDetails(identifier: string): Promise<ProductImportData> {
  const isUrl = identifier.startsWith('http://') || identifier.startsWith('https://');
  const prompt = `
    Analise o produto com base no seguinte ${isUrl ? 'URL' : 'descrição'} e extraia as informações solicitadas.
    Identificador: ${identifier}
    
    Forneça a resposta em formato JSON. Não inclua nenhum texto antes ou depois do objeto JSON.
    Se um valor não puder ser encontrado, use um padrão razoável ou nulo. Para dimensões e peso, forneça estimativas realistas se não forem mencionadas explicitamente.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      category: { type: Type.STRING, description: 'Categoria do produto' },
      length: { type: Type.NUMBER, description: 'Comprimento do produto em cm' },
      width: { type: Type.NUMBER, description: 'Largura do produto em cm' },
      height: { type: Type.NUMBER, description: 'Altura do produto em cm' },
      weight: { type: Type.NUMBER, description: 'Peso do produto em kg' },
      sellingPrice: { type: Type.NUMBER, description: 'Preço de venda do produto' },
      imageUrl: { type: Type.STRING, description: 'URL da imagem principal do produto' },
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
    throw new Error("Não foi possível extrair as informações do produto. Verifique a URL/descrição ou tente novamente.");
  }
}

export async function getFinancialAnalysis(formData: FormData): Promise<GeminiAnalysisResponse> {
    const prompt = `
    Você é um consultor sênior de e-commerce especializado no mercado brasileiro. Sua tarefa é fornecer uma análise comparativa profissional e detalhada para a venda de um produto nos 3 principais marketplaces brasileiros: Mercado Livre, Amazon Brasil e Magazine Luiza.

    Dados do Produto e Financeiros:
    - Categoria: ${formData.category}
    - Dimensões (CxLxA cm): ${formData.length} x ${formData.width} x ${formData.height}
    - Peso (kg): ${formData.weight}
    - Preço de Venda (BRL): ${formData.sellingPrice}
    - Custo de Aquisição (BRL): ${formData.acquisition}
    - Custo da Embalagem (BRL): ${formData.packagingCost}
    - Margem de Lucro Desejada: ${formData.desiredProfitMargin}%
    - Estado de Destino (Brasil): ${formData.state}
    - CEP de Destino (para simulação de frete): ${formData.destinationCep}

    Sua análise deve ser retornada como um único objeto JSON com a seguinte estrutura:

    1.  \`taxRate\`: Estime a alíquota de imposto combinada (ICMS, etc.) como um único decimal para este produto e região.
    2.  \`packageSuggestion\`: Sugira uma embalagem ideal. Inclua:
        *   \`dimensions\`: As dimensões externas da embalagem (ex: "30x20x5 cm").
        *   \`type\`: O tipo e material de embalagem recomendados (ex: "Caixa de papelão pardo", "Envelope de segurança com plástico-bolha").
        *   \`reason\`: Uma breve explicação para sua escolha, considerando proteção e custos de envio.
    3.  \`marketplaceComparison\`: Um array de objetos, um para cada marketplace (Mercado Livre, Amazon Brasil, Magazine Luiza). Cada objeto deve conter:
        *   \`name\`: O nome do marketplace.
        *   \`feeRate\`: A taxa de comissão estimada como um decimal para esta categoria.
        *   \`shippingCost\`: O custo de envio estimado em BRL. Deve ser uma estimativa realista para o CEP de destino, considerando tanto os programas de logística da plataforma (como Mercado Envios Full/FBA) quanto os custos padrão dos Correios (PAC/SEDEX) como base de cálculo.
        *   \`shippingInfo\`: Uma breve explicação sobre o programa de frete deles.
        *   \`pros\`: Um array de strings listando as vantagens de vender este produto nesta plataforma.
        *   \`cons\`: Um array de strings listando as desvantagens.
    4.  \`strategicRecommendation\`: Uma recomendação conclusiva e detalhada sobre qual marketplace é a melhor escolha para este produto específico, justificando sua escolha com base na análise. Inclua também cenários de vendas otimista, realista e pessimista para o marketplace recomendado, considerando a margem de lucro desejada.

    Forneça APENAS o objeto JSON em sua resposta. Seja extremamente detalhado e profissional em suas explicações.
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
      taxRate: { type: Type.NUMBER, description: 'Taxa de imposto total estimada como decimal (ex: 0.18 para 18%)' },
      packageSuggestion: {
        type: Type.OBJECT,
        properties: {
          dimensions: { type: Type.STRING, description: 'Dimensões sugeridas para a embalagem' },
          type: { type: Type.STRING, description: 'Tipo e material sugerido para a embalagem' },
          reason: { type: Type.STRING, description: 'Justificativa para a sugestão de embalagem' },
        },
        required: ['dimensions', 'type', 'reason']
      },
      marketplaceComparison: {
        type: Type.ARRAY,
        items: marketplaceDetailSchema,
      },
      strategicRecommendation: { type: Type.STRING, description: 'Recomendação estratégica e análise de cenários.' },
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
    throw new Error("A IA não conseguiu gerar uma análise financeira. Verifique os dados de entrada ou tente novamente.");
  }
}