import React, { useState, useEffect } from 'react';
import { CalculationResults, MarketplaceResult } from '../types';

interface ResultsDisplayProps {
  results: CalculationResults | null;
  isLoading: boolean;
  error: string | null;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatPercentage = (value: number) => {
  return `${value.toFixed(2)}%`;
};

const ResultCard: React.FC<{ title: string; children: React.ReactNode; icon?: React.ReactNode }> = ({ title, children, icon }) => (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <div className="flex items-center mb-4">
            {icon && <div className="mr-3 text-blue-500">{icon}</div>}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <div className="text-gray-700 dark:text-gray-300 space-y-2">
            {children}
        </div>
    </div>
);

const MarketplaceCard: React.FC<{ marketplace: MarketplaceResult }> = ({ marketplace }) => {
    const isProfitable = marketplace.profitMargin > 0;
    const profitMarginColor = isProfitable ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400';

    return (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 flex flex-col justify-between">
            <div>
                <h4 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-4">{marketplace.name}</h4>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span>Taxa do Marketplace:</span> <span className="font-medium">{formatPercentage(marketplace.feeRate * 100)} ({formatCurrency(marketplace.marketplaceFeeValue)})</span></div>
                    <div className="flex justify-between"><span>Custo de Frete:</span> <span className="font-medium">{formatCurrency(marketplace.shippingCost)}</span></div>
                    <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2 mt-2"><span>Custos Totais:</span> <span className="font-semibold">{formatCurrency(marketplace.totalCosts)}</span></div>
                    <div className="flex justify-between font-bold text-lg"><span>Lucro Líquido:</span> <span>{formatCurrency(marketplace.netProfit)}</span></div>
                    <div className={`flex justify-between font-bold text-lg ${profitMarginColor}`}><span>Margem de Lucro:</span> <span>{formatPercentage(marketplace.profitMargin)}</span></div>
                </div>
                <div className="mt-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{marketplace.shippingInfo}</p>
                </div>
                 <div className="mt-4">
                    <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Prós:</h5>
                    <ul className="list-disc list-inside text-sm space-y-1">
                        {marketplace.pros.map((pro, index) => <li key={index}>{pro}</li>)}
                    </ul>
                </div>
                <div className="mt-4">
                    <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Contras:</h5>
                    <ul className="list-disc list-inside text-sm space-y-1">
                        {marketplace.cons.map((con, index) => <li key={index}>{con}</li>)}
                    </ul>
                </div>
            </div>
        </div>
    );
};


export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, isLoading, error }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer: number;
    if (isLoading) {
      setProgress(0);
      let currentProgress = 0;
      timer = window.setInterval(() => {
        currentProgress += 5;
        if (currentProgress < 95) {
          setProgress(currentProgress);
        } else {
          window.clearInterval(timer);
        }
      }, 500);
    } else {
      setProgress(100);
    }
    return () => {
      window.clearInterval(timer);
    };
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="w-full lg:w-1/2 p-4 flex justify-center items-center">
        <div className="text-center w-full max-w-md">
           <svg className="animate-spin mx-auto h-12 w-12 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">Analisando com Gemini... Por favor, aguarde.</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">A IA está processando os dados para fornecer a melhor estratégia.</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
          </div>
           <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{progress}%</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
       <div className="w-full lg:w-1/2 p-4 flex justify-center items-center">
         <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded relative w-full" role="alert">
           <strong className="font-bold">Erro na Análise:</strong>
           <span className="block sm:inline ml-2">{error}</span>
         </div>
       </div>
    );
  }

  if (!results) {
    return (
      <div className="w-full lg:w-1/2 p-4 flex justify-center items-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="mt-2 text-xl font-semibold">Aguardando Análise</h2>
          <p className="mt-1">Preencha os dados ao lado e clique em "Analisar Lucratividade" para ver os resultados.</p>
        </div>
      </div>
    );
  }
  
  const { aiResponse, calculatedMarketplaces } = results;

  return (
    <div className="w-full lg:w-1/2 p-4 space-y-6">
       <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Resultados da Análise de IA</h2>
       
        <ResultCard title="Sugestões da IA">
            <p><strong>Alíquota de Imposto Estimada:</strong> {formatPercentage(aiResponse.taxRate * 100)}</p>
            <div className="pt-2">
                <p className="font-semibold">Sugestão de Embalagem:</p>
                <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700 mt-1 text-sm">
                    <p><strong>Tipo:</strong> {aiResponse.packageSuggestion.type}</p>
                    <p><strong>Dimensões:</strong> {aiResponse.packageSuggestion.dimensions}</p>
                    <p><strong>Justificativa:</strong> {aiResponse.packageSuggestion.reason}</p>
                </div>
            </div>
        </ResultCard>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            {calculatedMarketplaces.sort((a, b) => b.netProfit - a.netProfit).map(mp => (
                <MarketplaceCard key={mp.name} marketplace={mp} />
            ))}
        </div>

        <ResultCard title="Recomendação Estratégica da IA">
           <p className="whitespace-pre-wrap">{aiResponse.strategicRecommendation}</p>
        </ResultCard>
    </div>
  );
};
