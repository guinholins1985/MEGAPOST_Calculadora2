
import React, { useState, useCallback } from 'react';
import { InputForm } from './components/InputForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { getFinancialAnalysis } from './services/geminiService';
import { FormData, CalculationResults, MarketplaceResult } from './types';

const App: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    category: 'Eletrônicos',
    length: 20,
    width: 15,
    height: 5,
    weight: 0.5,
    acquisition: 50.00,
    packagingCost: 1.50,
    adFee: 5.00,
    marketing: 2.00,
    storage: 1.00,
    returnRate: 5,
    desiredProfitMargin: 20,
    state: 'SP',
    destinationCep: '01001-000',
    sellingPrice: 129.90,
  });

  const [results, setResults] = useState<CalculationResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const aiResponse = await getFinancialAnalysis(formData);
      
      const calculatedMarketplaces: MarketplaceResult[] = aiResponse.marketplaceComparison.map(mkt => {
          const taxValue = formData.sellingPrice * aiResponse.taxRate;
          const marketplaceFeeValue = formData.sellingPrice * mkt.feeRate;
          const returnCost = formData.sellingPrice * (formData.returnRate / 100);
          const shippingCost = mkt.shippingCost;
          
          const otherCosts = formData.adFee + formData.marketing + formData.storage;
          const totalCosts = formData.acquisition + formData.packagingCost + otherCosts + taxValue + marketplaceFeeValue + returnCost + shippingCost;
          
          const netProfit = formData.sellingPrice - totalCosts;
          const profitMargin = formData.sellingPrice > 0 ? (netProfit / formData.sellingPrice) * 100 : 0;

          return {
              ...mkt,
              totalCosts,
              netProfit,
              profitMargin: isFinite(profitMargin) ? profitMargin : 0,
              taxValue,
              marketplaceFeeValue,
              returnCost,
              otherCosts: otherCosts + formData.acquisition + formData.packagingCost, // Pass all non-platform costs
          };
      });

      setResults({
        aiResponse,
        calculatedMarketplaces,
        acquisitionCost: formData.acquisition,
        packagingCost: formData.packagingCost,
      });

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [formData]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight text-center text-gray-900 dark:text-white">
            Calculadora de Lucratividade com IA para Marketplaces
          </h1>
          <p className="text-center text-gray-500 dark:text-gray-400 mt-1">
            Simule seus custos e descubra o melhor marketplace para seu produto com a ajuda do Gemini.
          </p>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto flex flex-wrap lg:flex-nowrap">
          <InputForm formData={formData} setFormData={setFormData} onAnalyze={handleAnalyze} isLoading={isLoading} />
          <div className="w-full lg:w-px bg-gray-200 dark:bg-gray-700 my-4 lg:my-0"></div>
          <ResultsDisplay results={results} isLoading={isLoading} error={error} />
        </div>
      </main>
    </div>
  );
};

export default App;