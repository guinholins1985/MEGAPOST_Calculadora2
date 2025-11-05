import React, { useState, useEffect } from 'react';
import { CalculationResults, MarketplaceResult, StrategicRecommendation, SalesScenario } from '../types';

interface ResultsDisplayProps {
  results: CalculationResults | null;
  isLoading: boolean;
  error: string | null;
}

const formatCurrency = (value: number) => {
  if (isNaN(value) || !isFinite(value)) {
    return 'N/A';
  }
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatPercentage = (value: number) => {
    if (isNaN(value) || !isFinite(value)) {
    return 'N/A';
  }
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

const FinancialDetails: React.FC<{ marketplace: MarketplaceResult }> = ({ marketplace }) => {
    const costBreakdown = [
        { label: 'Custo do Produto', value: marketplace.otherCosts - (marketplace.packagingCost + marketplace.adFee + marketplace.marketing + marketplace.storage) },
        { label: 'Comissão + Tx. Pagamento', value: marketplace.marketplaceFeeValue + marketplace.paymentFeeValue },
        { label: 'Impostos', value: marketplace.taxValue },
        { label: 'Frete', value: marketplace.shippingCost },
        { label: 'Devoluções', value: marketplace.returnCost },
        { label: 'Outros Custos Fixos', value: marketplace.packagingCost + marketplace.adFee + marketplace.marketing + marketplace.storage },
    ];

    return (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4 text-sm">
            <div>
                <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Detalhamento de Custos</h5>
                <ul className="space-y-1">
                    {costBreakdown.map(item => (
                        <li key={item.label} className="flex justify-between">
                            <span>{item.label}:</span>
                            <span className="font-mono">{formatCurrency(item.value)}</span>
                        </li>
                    ))}
                </ul>
            </div>
             <div>
                <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Métricas Chave</h5>
                 <ul className="space-y-1">
                    <li className="flex justify-between"><span>Margem de Lucro Bruta:</span> <span className="font-semibold">{formatPercentage(marketplace.grossProfitMargin)}</span></li>
                    <li className="flex justify-between"><span>Retorno Sobre Investimento (ROI):</span> <span className="font-semibold">{formatPercentage(marketplace.roi)}</span></li>
                    <li className="flex justify-between"><span>Ponto de Equilíbrio (Unidades):</span> <span className="font-semibold">{marketplace.breakEvenUnits > 0 ? `${marketplace.breakEvenUnits} un.` : 'N/A'}</span></li>
                 </ul>
            </div>
             <div>
                <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Otimização de Preço</h5>
                 <p>Preço sugerido para sua margem de lucro desejada: <span className="font-bold text-blue-500 dark:text-blue-400">{formatCurrency(marketplace.idealSellingPrice)}</span></p>
            </div>
        </div>
    );
};


const MarketplaceCard: React.FC<{ marketplace: MarketplaceResult; isExpanded: boolean; onToggle: () => void; }> = ({ marketplace, isExpanded, onToggle }) => {
    const isProfitable = marketplace.profitMargin > 0;
    const profitMarginColor = isProfitable ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400';

    return (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 flex flex-col justify-between transition-all duration-300">
            <div>
                <h4 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-4">{marketplace.name}</h4>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span>Taxas Totais (Comissão + Pag.):</span> <span className="font-medium">{formatPercentage((marketplace.feeRate + marketplace.paymentFeeRate) * 100)} ({formatCurrency(marketplace.marketplaceFeeValue + marketplace.paymentFeeValue)})</span></div>
                    <div className="flex justify-between"><span>Custo de Frete:</span> <span className="font-medium">{formatCurrency(marketplace.shippingCost)}</span></div>
                    <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2 mt-2"><span>Custos Totais:</span> <span className="font-semibold">{formatCurrency(marketplace.totalCosts)}</span></div>
                    <div className="flex justify-between font-bold text-lg"><span>Lucro Líquido:</span> <span>{formatCurrency(marketplace.netProfit)}</span></div>
                    <div className={`flex justify-between font-bold text-lg ${profitMarginColor}`}><span>Margem de Lucro:</span> <span>{formatPercentage(marketplace.profitMargin)}</span></div>
                </div>
                 <div className="mt-4">
                     <button onClick={onToggle} className="text-sm text-blue-600 dark:text-blue-400 hover:underline w-full text-center">
                         {isExpanded ? 'Ocultar Detalhes' : 'Ver Detalhes Financeiros'}
                     </button>
                 </div>
                 {isExpanded && <FinancialDetails marketplace={marketplace} />}
            </div>
        </div>
    );
};

const SimulationsCard: React.FC<{ results: CalculationResults }> = ({ results }) => {
    const [quantity, setQuantity] = useState(50);
    const [discount, setDiscount] = useState(0);

    return (
      <ResultCard title="Simulações e Projeções">
          <div className="space-y-6">
              <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantidade Vendida</label>
                  <input type="number" id="quantity" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="mt-1 w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
              </div>
              <div>
                  <label htmlFor="discount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Desconto Aplicado (%)</label>
                  <input type="number" id="discount" value={discount} onChange={e => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))} className="mt-1 w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Resultados da Simulação:</h4>
                  <ul className="space-y-2 text-sm">
                      {results.calculatedMarketplaces.map(mp => {
                          const discountedPrice = mp.idealSellingPrice * (1 - discount / 100);
                          const newNetProfit = discountedPrice - mp.totalCosts; // Simplified for this simulation
                          const totalProjectedProfit = newNetProfit * quantity;

                          return (
                              <li key={mp.name} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                  <p className="font-bold">{mp.name}</p>
                                  <div className="flex justify-between">
                                      <span>Lucro Total Projetado:</span>
                                      <span className={totalProjectedProfit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>{formatCurrency(totalProjectedProfit)}</span>
                                  </div>
                              </li>
                          )
                      })}
                  </ul>
              </div>
          </div>
      </ResultCard>
    );
};

const StrategicRecommendationDisplay: React.FC<{ recommendation: StrategicRecommendation }> = ({ recommendation }) => {
    const { recommendedMarketplace, justification, pricingStrategy, marketingActions, logisticsAndPackaging, riskAnalysis, salesScenarios } = recommendation;

    const Scenario: React.FC<{ title: string, data: SalesScenario }> = ({ title, data }) => (
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h5 className="font-semibold text-gray-800 dark:text-gray-200">{title}</h5>
            <p className="text-sm text-gray-600 dark:text-gray-400">{data.description}</p>
            <div className="mt-2 text-sm flex justify-between">
                <span>Vendas: <strong>{data.unitsSold} un.</strong></span>
                <span>Lucro: <strong className="text-green-600 dark:text-green-400">{data.netProfit}</strong></span>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <p className="text-center text-lg">
                Marketplace Recomendado: <span className="font-bold text-blue-600 dark:text-blue-400">{recommendedMarketplace}</span>
            </p>
            
            <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Justificativa</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{justification}</p>
            </div>

            <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Estratégia de Preço</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{pricingStrategy}</p>
            </div>

             <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Ações de Marketing</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {marketingActions.map((action, i) => <li key={i}>{action}</li>)}
                </ul>
            </div>

            <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Logística e Embalagem</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{logisticsAndPackaging}</p>
            </div>

            <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Análise de Riscos</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{riskAnalysis}</p>
            </div>

            <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Cenários de Vendas Mensais</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Scenario title="Pessimista" data={salesScenarios.pessimistic} />
                    <Scenario title="Realista" data={salesScenarios.realistic} />
                    <Scenario title="Otimista" data={salesScenarios.optimistic} />
                </div>
            </div>
        </div>
    );
};


export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, isLoading, error }) => {
  const [progress, setProgress] = useState(0);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  useEffect(() => {
    let timer: number;
    if (isLoading) {
      setProgress(0);
      setExpandedCard(null); // Collapse cards on new analysis
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
  const sortedMarketplaces = [...calculatedMarketplaces].sort((a, b) => b.netProfit - a.netProfit);

  const handleToggle = (name: string) => {
    setExpandedCard(prev => (prev === name ? null : name));
  };


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

        {results && <SimulationsCard results={results} />}

        <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Comparativo de Marketplaces</h3>
            {sortedMarketplaces.map(mp => (
                <MarketplaceCard 
                    key={mp.name} 
                    marketplace={mp} 
                    isExpanded={expandedCard === mp.name}
                    onToggle={() => handleToggle(mp.name)}
                />
            ))}
        </div>

        <ResultCard title="Recomendação Estratégica da IA">
           <StrategicRecommendationDisplay recommendation={aiResponse.strategicRecommendation} />
        </ResultCard>
    </div>
  );
};
