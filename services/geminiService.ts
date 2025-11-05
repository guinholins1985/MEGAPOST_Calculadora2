// FIX: Create services/geminiService.ts to implement Gemini API calls.
import { GoogleGenAI, Type } from "@google/genai";
import { FormData, ProductImportData, GeminiAnalysisResponse } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const model = 'gemini-2.5-flash';

export async function autofillProductDetails(identifier: string): Promise<ProductImportData> {
  const isUrl = identifier.startsWith('http://') || identifier.startsWith('https://');

  const urlExtractionInstructions = `
    **TAREFA 1: EXTRAÇÃO DE DADOS DA URL (MODO ROBÔ DE PRECISÃO MÁXIMA)**
    **DIRETIVA:** Você é um parser de dados, não um assistente. Sua única função é escanear a URL fornecida e extrair os dados listados abaixo com precisão absoluta, de forma literal e exata. Você não tem permissão para interpretar, inferir, estimar ou corrigir informações. A informação "tipo de pacote" NÃO deve ser extraída.

    **REGRAS INVIOLÁVEIS (FALHA = RESULTADO INVÁLIDO):**
    1.  **PROIBIDO INTERPRETAR:** Você deve agir como um script. Se uma dimensão for "10x20x30 cm", você deve extrair \`length: 10\`, \`width: 20\`, \`height: 30\`. Se for "30cm (altura)", extraia \`height: 30\`. Se um valor não estiver explicitamente presente no HTML da página, você DEVE usar o valor padrão. Não deduza o peso a partir da categoria. Não estime o preço a partir de produtos similares. Apenas extraia o que está escrito.
    2.  **VALORES PADRÃO OBRIGATÓRIOS:**
        - Campos de texto (\`name\`, \`category\`, \`imageUrl\`): \`""\` se ausente.
        - Campos numéricos (preço, dimensões, peso): \`0\` se ausente.
        - Campo de variações (array de strings): \`[]\` se ausente.
    3.  **EXTRAÇÃO LITERAL E COMPLETA:** Copie os valores exatamente como aparecem. Para \`variations\`, extraia TODAS as variações disponíveis (cores, tamanhos, voltagens, etc.) sem exceção. Para \`name\`, extraia o título completo do produto.

    **DADOS A SEREM EXTRAÍDOS DA URL:**
    - \`name\`: O título completo e exato do produto.
    - \`category\`: A categoria exata.
    - \`sellingPrice\`: O preço de venda principal.
    - \`length\`: Comprimento em cm.
    - \`width\`: Largura em cm.
    - \`height\`: Altura em cm.
    - \`weight\`: Peso em kg.
    - \`imageUrl\`: URL da imagem principal.
    - \`variations\`: Array de strings com TODAS as variações listadas (cor, tamanho, etc.).
  `;

  const textInterpretationInstructions = `
    **TAREFA 1: INTERPRETAÇÃO DE DADOS DO TEXTO**
    **DIRETIVA:** Sua tarefa é interpretar a descrição do produto e preencher os dados solicitados.
    
    **REGRAS:**
    1.  **INFERÊNCIA CUIDADOSA:** Tente extrair o nome e a categoria da forma mais precisa possível a partir do texto.
    2.  **ESTIMATIVA REALISTA:** Se dados como dimensões, peso ou preço não forem mencionados, estime valores realistas com base no tipo de produto descrito.
    3.  **VARIAÇÕES:** Infira possíveis variações que façam sentido para o produto.
    
    **DADOS A SEREM INTERPRETADOS DO TEXTO:**
    - \`name\`: O nome mais provável do produto.
    - \`category\`: A categoria mais apropriada.
    - \`sellingPrice\`: Preço de venda (estimado se ausente).
    - \`length\`, \`width\`, \`height\`: Dimensões em cm (estimadas se ausente).
    - \`weight\`: Peso em kg (estimado se ausente).
    - \`imageUrl\`: Deixe em branco ("").
    - \`variations\`: Array de strings com variações inferidas.
  `;

  const costEstimationInstructions = `
    **TAREFA 2: ESTIMATIVA DE CUSTOS (MODO CONSULTOR)**
    **DIRETIVA:** Com base nos dados obtidos na TAREFA 1, agora atue como um consultor de e-commerce e estime os seguintes custos operacionais de forma realista.
    
    **CUSTOS A SEREM ESTIMADOS (SEMPRE):**
    - \`acquisition\`: Custo de aquisição (BRL).
    - \`packagingCost\`: Custo de embalagem (BRL).
    - \`adFee\`: Taxa de anúncio (BRL).
    - \`marketing\`: Custo com marketing (BRL).
    - \`storage\`: Custo de armazenagem (BRL).
    - \`returnRate\`: Taxa de devolução (%, ex: 3 para 3%).
  `;

  const prompt = `
    Sua tarefa é dividida em duas partes: primeiro extrair/interpretar dados de um produto, e depois estimar seus custos. Retorne um único objeto JSON com o resultado de ambas as tarefas.
    O produto é identificado por: "${identifier}".

    ${isUrl ? urlExtractionInstructions : textInterpretationInstructions}

    ${costEstimationInstructions}

    Forneça a resposta **APENAS** como um objeto JSON. Não inclua texto ou formatação markdown.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'Nome/Título completo do produto' },
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
    required: ['name', 'category', 'length', 'width', 'height', 'weight', 'sellingPrice', 'imageUrl', 'acquisition', 'packagingCost', 'adFee', 'marketing', 'storage', 'returnRate', 'variations'],
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