// FIX: Create components/ResultsDisplay.tsx to render the analysis results.
import React from 'react';
import { CalculationResults, MarketplaceResult } from '../types';

interface ResultsDisplayProps {
  results: CalculationResults | null;
  isLoading: boolean;
  error: string | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const ResultCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={`bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 ${className}`}>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">{title}</h3>
    {children}
  </div>
);

const Metric: React.FC<{ label: string; value: string | number; color?: string; isCurrency?: boolean; note?: string; className?: string }> = ({ label, value, color, isCurrency = true, note, className = '' }) => (
  <div className={`flex justify-between items-center py-1.5 ${className}`}>
    <p className="text-sm text-gray-600 dark:text-gray-300">
      {label}
      {note && <span className="text-xs text-gray-400"> {note}</span>}
    </p>
    <p className={`text-sm font-medium ${color}`}>
      {isCurrency ? formatCurrency(Number(value)) : value}
    </p>
  </div>
);


const MarketplaceBreakdownCard: React.FC<{ mkt: MarketplaceResult, sellingPrice: number }> = ({ mkt, sellingPrice }) => {
    const isProfit = mkt.netProfit > 0;
    const profitColor = isProfit ? 'text-green-500' : 'text-red-500';

    return (
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <h4 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-3">{mkt.name}</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                {/* Coluna da Esquerda: Resumo Financeiro */}
                <div>
                    <h5 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Resultado Final</h5>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700 dark:text-gray-200">Lucro Líquido</span>
                            <span className={`text-2xl font-bold ${profitColor}`}>{formatCurrency(mkt.netProfit)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700 dark:text-gray-200">Margem de Lucro</span>
                             <span className={`text-lg font-bold ${profitColor}`}>{mkt.profitMargin.toFixed(2)}%</span>
                        </div>
                    </div>

                    <h5 className="font-semibold text-gray-800 dark:text-gray-100 mt-4 mb-2">Detalhamento de Custos</h5>
                    <div className="text-xs space-y-1 text-gray-600 dark:text-gray-300">
                       <Metric label="Preço de Venda" value={sellingPrice} color="text-gray-900 dark:text-white" />
                       <hr className="my-1 border-gray-200 dark:border-gray-600"/>
                       <Metric label="Custo do Produto" value={mkt.otherCosts - mkt.marketplaceFeeValue - mkt.taxValue - mkt.returnCost - mkt.shippingCost} color="text-red-500" />
                       <Metric label="Impostos" value={mkt.taxValue} color="text-red-500" note={`(${(mkt.taxValue / sellingPrice * 100).toFixed(1)}%)`} />
                       <Metric label="Taxa da Plataforma" value={mkt.marketplaceFeeValue} color="text-red-500" note={`(${(mkt.feeRate * 100).toFixed(1)}%)`} />
                       <Metric label="Custo de Envio" value={mkt.shippingCost} color="text-red-500" />
                       <Metric label="Custo de Devolução" value={mkt.returnCost} color="text-red-500" />
                       <Metric label="Outros Custos" value={mkt.otherCosts - (mkt.otherCosts - mkt.marketplaceFeeValue - mkt.taxValue - mkt.returnCost - mkt.shippingCost)} color="text-red-500" />
                       <hr className="my-1 border-gray-200 dark:border-gray-600"/>
                       <Metric label="Custo Total" value={mkt.totalCosts} color="font-bold text-red-600" />
                    </div>
                </div>

                {/* Coluna da Direita: Análise Qualitativa */}
                <div>
                    <h5 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 mt-4 md:mt-0">Análise da Plataforma</h5>
                     <p className="text-sm mt-2"><strong>Logística e Frete:</strong> {mkt.shippingInfo}</p>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                        <div>
                            <h5 className="font-semibold text-green-600 dark:text-green-400">Prós</h5>
                            <ul className="list-disc list-inside text-sm mt-1 space-y-1 text-gray-700 dark:text-gray-300">
                                {mkt.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                            </ul>
                        </div>
                        <div>
                            <h5 className="font-semibold text-red-600 dark:text-red-400">Contras</h5>
                            <ul className="list-disc list-inside text-sm mt-1 space-y-1 text-gray-700 dark:text-gray-300">
                                {mkt.cons.map((con, i) => <li key={i}>{con}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, isLoading, error }) => {
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <svg className="animate-spin h-12 w-12 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Analisando com Gemini...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Gerando análise comparativa detalhada e simulações. Isso pode levar alguns segundos.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mb-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <h3 className="text-xl font-semibold text-red-700 dark:text-red-400">Ocorreu um Erro</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-300">{error}</p>
        </div>
      );
    }

    if (!results) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Aguardando Análise</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Preencha os dados e clique em "Analisar Lucratividade" para ver os resultados.</p>
        </div>
      );
    }
    
    // Assuming sellingPrice is needed and can be derived from one of the results
    const sellingPrice = (results.calculatedMarketplaces[0]?.totalCosts || 0) + (results.calculatedMarketplaces[0]?.netProfit || 0);

    return (
      <div className="space-y-6">
        <ResultCard title="Análise Comparativa de Marketplaces (IA)">
            <div className="space-y-6">
                {results.calculatedMarketplaces.map((mkt) => (
                    <MarketplaceBreakdownCard key={mkt.name} mkt={mkt} sellingPrice={sellingPrice}/>
                ))}
            </div>
        </ResultCard>

        <ResultCard title="Recomendação Estratégica e Cenários (IA)">
            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{results.aiResponse.strategicRecommendation}</p>
        </ResultCard>

        <ResultCard title="Sugestão de Embalagem (IA)">
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md space-y-2">
              <p className="text-sm"><strong>Dimensões Sugeridas:</strong> <span className="font-mono bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">{results.aiResponse.packageSuggestion.dimensions}</span></p>
              <p className="text-sm"><strong>Tipo/Material:</strong> {results.aiResponse.packageSuggestion.type}</p>
              <p className="text-sm mt-1"><strong>Justificativa:</strong> {results.aiResponse.packageSuggestion.reason}</p>
            </div>
        </ResultCard>

      </div>
    );
  };

  return (
    <div className="w-full lg:w-1/2 p-4 lg:p-6 lg:overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
      {renderContent()}
    </div>
  );
};