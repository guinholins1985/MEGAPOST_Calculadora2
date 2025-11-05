export interface ProductInfo {
  name: string;
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
  name: string;
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
  paymentFeeRate: number; // NEW: as decimal for payment processing
  shippingCost: number; // Novo: Custo de frete específico
  shippingInfo: string;
  pros: string[];
  cons: string[];
}

export interface SalesScenario {
  unitsSold: number;
  netProfit: string;
  description: string;
}

export interface StrategicRecommendation {
  recommendedMarketplace: string;
  justification: string;
  pricingStrategy: string;
  marketingActions: string[];
  logisticsAndPackaging: string;
  riskAnalysis: string;
  salesScenarios: {
    optimistic: SalesScenario;
    realistic: SalesScenario;
    pessimistic: SalesScenario;
  };
}

export interface GeminiAnalysisResponse {
  taxRate: number;
  packageSuggestion: {
    dimensions: string;
    type: string; // Novo: Tipo de embalagem
    reason: string;
  };
  marketplaceComparison: MarketplaceDetail[];
  strategicRecommendation: StrategicRecommendation;
}

// Nova interface para resultados calculados por marketplace
export interface MarketplaceResult extends MarketplaceDetail {
    totalCosts: number;
    netProfit: number;
    profitMargin: number; // Net profit margin
    taxValue: number;
    marketplaceFeeValue: number;
    paymentFeeValue: number; // NEW
    returnCost: number;
    otherCosts: number;
    // NEW METRICS
    grossProfitMargin: number;
    roi: number;
    breakEvenUnits: number;
    idealSellingPrice: number;
    breakEvenPrice: number; // NEW
    viabilityAnalysis: string; // NEW
}

export interface CalculationResults {
  aiResponse: GeminiAnalysisResponse;
  calculatedMarketplaces: MarketplaceResult[];
  acquisitionCost: number;
  packagingCost: number;
}