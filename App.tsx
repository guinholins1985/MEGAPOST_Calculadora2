import React, { useState } from 'react';
import { InputForm } from './components/InputForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { FormData, CalculationResults, MarketplaceResult, GeminiAnalysisResponse } from './types';
import { getFinancialAnalysis } from './services/geminiService';

const initialFormData: FormData = {
  category: '',
  length: 0,
  width: 0,
  height: 0,
  weight: 0,
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

  const calculateMarketplaceMetrics = (
    aiResponse: GeminiAnalysisResponse,
    data: FormData
  ): MarketplaceResult[] => {
    return aiResponse.marketplaceComparison.map(mp => {
      const taxValue = data.sellingPrice * aiResponse.taxRate;
      const marketplaceFeeValue = data.sellingPrice * mp.feeRate;
      const returnCost = data.sellingPrice * (data.returnRate / 100);

      const otherCosts = data.acquisition + data.packagingCost + data.adFee + data.marketing + data.storage;
      const totalCosts = otherCosts + taxValue + marketplaceFeeValue + mp.shippingCost + returnCost;
      const netProfit = data.sellingPrice - totalCosts;
      const profitMargin = data.sellingPrice > 0 ? (netProfit / data.sellingPrice) * 100 : 0;

      return {
        ...mp,
        taxValue,
        marketplaceFeeValue,
        returnCost,
        otherCosts,
        totalCosts,
        netProfit,
        profitMargin,
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
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calculadora de Lucratividade para Marketplaces</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Análise detalhada com IA para otimizar suas vendas no Brasil.</p>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:space-x-8">
          <InputForm
            formData={formData}
            setFormData={setFormData}
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
          />
          <ResultsDisplay
            results={results}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
