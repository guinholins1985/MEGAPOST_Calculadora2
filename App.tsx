import React, { useState } from 'react';
import { InputForm } from './components/InputForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { FormData, CalculationResults, MarketplaceResult, GeminiAnalysisResponse } from './types';
import { getFinancialAnalysis } from './services/geminiService';

const initialFormData: FormData = {
  name: '',
  category: '',
  length: 0,
  width: 0,
  height: 0,
  weight: 0,
  variations: [],
  sellingPrice: 0,
  acquisition: 0,
  packagingCost: 0,
  adFee: 0,
  marketing: 0,
  storage: 0,
  returnRate: 0,
  desiredProfitMargin: 0,
  state: '',
  destinationCep: '',
};

function App() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);

  const calculateMarketplaceMetrics = (
    aiResponse: GeminiAnalysisResponse,
    data: FormData
  ): MarketplaceResult[] => {
    return aiResponse.marketplaceComparison.map(mp => {
      // Cost definitions
      const fixedCosts = data.storage + data.marketing + data.adFee;
      const baseVariableCosts = data.acquisition + data.packagingCost + mp.shippingCost;
      const baseAndFixedCosts = baseVariableCosts + fixedCosts;
      const allSellerCostsForInvestment = data.acquisition + data.packagingCost + fixedCosts;

      // Rate definitions (as decimals)
      const taxRate = aiResponse.taxRate;
      const returnRate = data.returnRate / 100;
      const totalVariableRatesOnPrice = taxRate + mp.feeRate + mp.paymentFeeRate + returnRate;

      // Value calculations for current selling price
      const taxValue = data.sellingPrice * taxRate;
      const marketplaceFeeValue = data.sellingPrice * mp.feeRate;
      const paymentFeeValue = data.sellingPrice * mp.paymentFeeRate;
      const returnCost = data.sellingPrice * returnRate;

      const otherCosts = data.acquisition + data.packagingCost + fixedCosts;
      const totalCosts = otherCosts + taxValue + marketplaceFeeValue + paymentFeeValue + mp.shippingCost + returnCost;
      
      const netProfit = data.sellingPrice - totalCosts;
      const profitMargin = data.sellingPrice > 0 ? (netProfit / data.sellingPrice) * 100 : 0;

      // NEW METRICS
      const grossProfitMargin = data.sellingPrice > 0 ? ((data.sellingPrice - data.acquisition) / data.sellingPrice) * 100 : 0;
      
      const roi = allSellerCostsForInvestment > 0 ? (netProfit / allSellerCostsForInvestment) * 100 : 0;

      const contributionMarginPerUnit = data.sellingPrice * (1 - totalVariableRatesOnPrice) - baseVariableCosts;
      const breakEvenUnits = fixedCosts > 0 && contributionMarginPerUnit > 0 ? Math.ceil(fixedCosts / contributionMarginPerUnit) : 0;

      // Break-even and Ideal selling price calculation
      const desiredMarginRate = data.desiredProfitMargin / 100;
      
      let breakEvenPrice = 0;
      if (totalVariableRatesOnPrice < 1) {
        breakEvenPrice = baseAndFixedCosts / (1 - totalVariableRatesOnPrice);
      }
      
      let idealSellingPrice = 0;
      const allRatesForIdealPrice = desiredMarginRate + totalVariableRatesOnPrice;
      if (allRatesForIdealPrice < 1) {
          idealSellingPrice = baseAndFixedCosts / (1 - allRatesForIdealPrice);
      }

      // Viability Analysis
      let viabilityAnalysis = '';
      const idealSellingPriceFormatted = idealSellingPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const breakEvenPriceFormatted = breakEvenPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      
      if (breakEvenPrice <= 0 || idealSellingPrice <= 0) {
          viabilityAnalysis = `Inviável. As taxas e comissões somam 100% ou mais da venda. A operação não é sustentável neste marketplace.`;
      } else if (netProfit > 0 && profitMargin >= data.desiredProfitMargin) {
          viabilityAnalysis = `Excelente. Seu preço atual já atinge a margem de lucro desejada. Venda altamente recomendada.`;
      } else if (netProfit > 0) {
          viabilityAnalysis = `Viável. O produto é lucrativo, mas para atingir sua meta de ${data.desiredProfitMargin}%, considere ajustar o preço para ${idealSellingPriceFormatted}.`;
      } else { // netProfit <= 0
          viabilityAnalysis = `Não recomendado. A venda no preço atual gera prejuízo. O preço mínimo para cobrir os custos é ${breakEvenPriceFormatted}. Para atingir sua meta, o preço deveria ser ${idealSellingPriceFormatted}.`;
      }

      return {
        ...mp,
        packagingCost: data.packagingCost,
        adFee: data.adFee,
        marketing: data.marketing,
        storage: data.storage,
        taxValue,
        marketplaceFeeValue,
        paymentFeeValue,
        returnCost,
        otherCosts,
        totalCosts,
        netProfit,
        profitMargin,
        grossProfitMargin,
        roi,
        breakEvenUnits,
        idealSellingPrice,
        breakEvenPrice,
        viabilityAnalysis,
      };
    });
  };


  const handleAnalyze = async (dataToAnalyze: FormData) => {
    setIsLoading(true);
    setError(null);
    setResults(null);
    try {
      const aiResponse = await getFinancialAnalysis(dataToAnalyze);
      const calculatedMarketplaces = calculateMarketplaceMetrics(aiResponse, dataToAnalyze);

      setResults({
        aiResponse,
        calculatedMarketplaces,
        acquisitionCost: dataToAnalyze.acquisition,
        packagingCost: dataToAnalyze.packagingCost,
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro desconhecido durante a análise.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Calculadora de Lucratividade com IA
          </h1>
          <p className="mt-4 max-w-3xl mx-auto text-xl text-gray-500 dark:text-gray-400">
            Simule cenários, compare marketplaces e receba uma estratégia completa para otimizar suas vendas no Brasil.
          </p>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:space-x-8">
          <InputForm
            formData={formData}
            setFormData={setFormData}
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
            productImageUrl={productImageUrl}
            setProductImageUrl={setProductImageUrl}
          />
          <ResultsDisplay
            results={results}
            isLoading={isLoading}
            error={error}
            formData={formData}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
