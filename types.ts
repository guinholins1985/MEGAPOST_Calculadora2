export interface ProductInfo {
  category: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  variations: string[]; // Novo
}

export interface CostInfo {
  acquisition: number;
  packagingCost: number; // Novo
  adFee: number;
  marketing: number;
  storage: number;
  returnRate: number;
}

export interface LocationInfo {
  state: string;
  destinationCep: string;
}

export interface FormData extends ProductInfo, CostInfo, LocationInfo {
  sellingPrice: number;
  desiredProfitMargin: number; // Novo
}

export interface ProductImportData {
  category: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  sellingPrice: number;
  imageUrl: string;
  acquisition: number;
  packagingCost: number;
  adFee: number;
  marketing: number;
  storage: number;
  returnRate: number; // Novo
  variations: string[]; // Novo
}

export interface MarketplaceDetail {
  name: string;
  feeRate: number; // as decimal
  shippingCost: number; // Novo: Custo de frete específico
  shippingInfo: string;
  pros: string[];
  cons: string[];
}

export interface GeminiAnalysisResponse {
  taxRate: number;
  packageSuggestion: {
    dimensions: string;
    type: string; // Novo: Tipo de embalagem
    reason: string;
  };
  marketplaceComparison: MarketplaceDetail[];
  strategicRecommendation: string;
}

// Nova interface para resultados calculados por marketplace
export interface MarketplaceResult extends MarketplaceDetail {
    totalCosts: number;
    netProfit: number;
    profitMargin: number;
    taxValue: number;
    marketplaceFeeValue: number;
    returnCost: number;
    otherCosts: number;
}

export interface CalculationResults {
  aiResponse: GeminiAnalysisResponse;
  calculatedMarketplaces: MarketplaceResult[];
  acquisitionCost: number;
  packagingCost: number;
}