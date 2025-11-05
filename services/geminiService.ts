// FIX: Create services/geminiService.ts to implement Gemini API calls.
import { GoogleGenAI, Type } from "@google/genai";
import { FormData, ProductImportData, GeminiAnalysisResponse } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const model = 'gemini-2.5-flash';

export async function autofillProductDetails(identifier: string): Promise<ProductImportData> {
  const isUrl = identifier.startsWith('http://') || identifier.startsWith('https://');
  const prompt = `
    Sua tarefa é analisar um produto e retornar seus detalhes em formato JSON.
    O produto é identificado por: "${identifier}".

    ${isUrl 
      ? `Isto é uma URL de um anúncio de marketplace. Aja como um extrator de dados preciso. Sua prioridade máxima é extrair os valores EXATOS que estão na página. NÃO invente valores se eles estiverem disponíveis no anúncio. Para dimensões e peso, procure exaustivamente na ficha técnica ou descrição; somente se for absolutamente impossível encontrar, você pode estimar.`
      : `Isto é uma descrição de texto. Extraia as informações da descrição. Se alguns dados não estiverem presentes, estime valores realistas com base no produto descrito.`
    }
    
    Extraia as seguintes informações:
    - Categoria do produto (category): A categoria exata listada no anúncio.
    - Dimensões: comprimento (length), largura (width), altura (height) em cm.
    - Peso (weight) em kg.
    - Preço de venda (sellingPrice) em BRL: O preço principal e visível do produto.
    - URL da imagem principal (imageUrl): URL completa, pública e direta para o arquivo de imagem.
    - Variações do produto (variations): Um array de strings com TODAS as variações disponíveis (ex: "Cor: Azul", "Tamanho: G", "Voltagem: 220v"). Extraia os nomes e valores exatos das variações. Se não houver, retorne um array vazio.

    Além disso, com base nos dados extraídos do produto, ESTIME os seguintes custos em BRL e taxas em porcentagem:
    - Custo de aquisição (acquisition)
    - Custo de embalagem (packagingCost)
    - Taxa de anúncio (adFee)
    - Custo com marketing (marketing)
    - Custo de armazenagem (storage)
    - Taxa de devolução (returnRate) em porcentagem (ex: 3 para 3%).

    Forneça a resposta APENAS como um objeto JSON. Não inclua nenhum texto, formatação markdown ou comentários antes ou depois do JSON.
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
      acquisition: { type: Type.NUMBER, description: 'Custo de aquisição estimado do produto em BRL' },
      packagingCost: { type: Type.NUMBER, description: 'Custo estimado da embalagem em BRL' },
      adFee: { type: Type.NUMBER, description: 'Custo estimado com taxa de anúncio em BRL' },
      marketing: { type: Type.NUMBER, description: 'Custo estimado com marketing em BRL' },
      storage: { type: Type.NUMBER, description: 'Custo estimado de armazenagem em BRL' },
      returnRate: { type: Type.NUMBER, description: 'Taxa de devolução estimada em porcentagem (ex: 3 para 3%)' },
      variations: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Variações do produto como cor, tamanho, etc.' },
    },
    required: ['category', 'length', 'width', 'height', 'weight', 'sellingPrice', 'imageUrl', 'acquisition', 'packagingCost', 'adFee', 'marketing', 'storage', 'returnRate', 'variations'],
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
    Você é um consultor sênior de e-commerce especializado no mercado brasileiro. Sua tarefa é fornecer uma análise comparativa profissional e detalhada para a venda de um produto nos 5 principais marketplaces brasileiros: Mercado Livre, Amazon Brasil, Magazine Luiza, Shopee e OLX.

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
    3.  \`marketplaceComparison\`: Um array de objetos, um para cada marketplace (Mercado Livre, Amazon Brasil, Magazine Luiza, Shopee, OLX). Cada objeto deve conter:
        *   \`name\`: O nome do marketplace.
        *   \`feeRate\`: A taxa de comissão de venda estimada como um decimal para esta categoria (NÃO inclua taxas de pagamento aqui).
        *   \`paymentFeeRate\`: A taxa de processamento de pagamento (cartão, etc.) como um decimal. Se já estiver 100% inclusa na \`feeRate\`, coloque 0.
        *   \`shippingCost\`: O custo de envio estimado em BRL. Deve ser uma estimativa realista para o CEP de destino, considerando tanto os programas de logística da plataforma (como Mercado Envios Full/FBA) quanto os custos padrão dos Correios (PAC/SEDEX) como base de cálculo.
        *   \`shippingInfo\`: Uma breve explicação sobre o programa de frete deles.
        *   \`pros\`: Um array de strings listando as vantagens de vender este produto nesta plataforma.
        *   \`cons\`: Um array de strings listando as desvantagens.
    4.  \`strategicRecommendation\`: Uma recomendação estratégica detalhada, estruturada da seguinte forma:
        *   \`recommendedMarketplace\`: O nome do marketplace que você mais recomenda.
        *   \`justification\`: Explicação clara e baseada em dados sobre por que este marketplace é a melhor escolha.
        *   \`pricingStrategy\`: Sugestão de preço inicial e táticas de precificação (ex: anúncios premium, descontos, kits).
        *   \`marketingActions\`: Um array com 3 a 5 ações de marketing concretas e práticas (ex: uso de Ads, otimização de título, resposta rápida a perguntas).
        *   \`logisticsAndPackaging\`: Recomendações sobre logística (ex: usar Fullfillment) e como a embalagem sugerida impacta.
        *   \`riskAnalysis\`: Análise dos principais riscos (ex: concorrência, devoluções) e como mitigá-los.
        *   \`salesScenarios\`: Um objeto com três cenários de vendas mensais para o marketplace recomendado:
            *   \`optimistic\`, \`realistic\`, \`pessimistic\`: Cada um contendo:
                *   \`unitsSold\`: Número de unidades vendidas.
                *   \`netProfit\`: O lucro líquido total como uma string formatada (ex: "R$ 12.500,00").
                *   \`description\`: Uma breve descrição do cenário.

    Forneça APENAS o objeto JSON em sua resposta. Seja extremamente detalhado e profissional em suas explicações.
  `;

  const marketplaceDetailSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        feeRate: { type: Type.NUMBER },
        paymentFeeRate: { type: Type.NUMBER },
        shippingCost: { type: Type.NUMBER },
        shippingInfo: { type: Type.STRING },
        pros: { type: Type.ARRAY, items: { type: Type.STRING } },
        cons: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ['name', 'feeRate', 'paymentFeeRate', 'shippingCost', 'shippingInfo', 'pros', 'cons'],
  };

  const salesScenarioSchema = {
    type: Type.OBJECT,
    properties: {
        unitsSold: { type: Type.NUMBER },
        netProfit: { type: Type.STRING },
        description: { type: Type.STRING },
    },
    required: ['unitsSold', 'netProfit', 'description'],
  };

  const strategicRecommendationSchema = {
      type: Type.OBJECT,
      properties: {
          recommendedMarketplace: { type: Type.STRING },
          justification: { type: Type.STRING },
          pricingStrategy: { type: Type.STRING },
          marketingActions: { type: Type.ARRAY, items: { type: Type.STRING } },
          logisticsAndPackaging: { type: Type.STRING },
          riskAnalysis: { type: Type.STRING },
          salesScenarios: {
              type: Type.OBJECT,
              properties: {
                  optimistic: salesScenarioSchema,
                  realistic: salesScenarioSchema,
                  pessimistic: salesScenarioSchema,
              },
              required: ['optimistic', 'realistic', 'pessimistic'],
          },
      },
      required: ['recommendedMarketplace', 'justification', 'pricingStrategy', 'marketingActions', 'logisticsAndPackaging', 'riskAnalysis', 'salesScenarios'],
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
      strategicRecommendation: strategicRecommendationSchema,
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