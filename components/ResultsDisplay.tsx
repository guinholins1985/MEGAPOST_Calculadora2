import React, { useState, useEffect, useRef } from 'react';
import { CalculationResults, MarketplaceResult, StrategicRecommendation, SalesScenario, FormData, GeminiAnalysisResponse } from '../types';
import html2canvas from 'html2canvas';

interface ResultsDisplayProps {
  results: CalculationResults | null;
  isLoading: boolean;
  error: string | null;
  formData: FormData;
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
                     <li className="flex justify-between font-bold border-t border-gray-200 dark:border-gray-600 pt-1 mt-1">
                        <span>Total de Custos por Unidade:</span>
                        <span className="font-mono">{formatCurrency(marketplace.totalCosts)}</span>
                    </li>
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
                 <p>Preço mínimo para cobrir custos (equilíbrio): <span className="font-bold text-yellow-600 dark:text-yellow-400">{formatCurrency(marketplace.breakEvenPrice)}</span></p>
                 <p>Preço sugerido para sua margem de lucro desejada: <span className="font-bold text-blue-500 dark:text-blue-400">{formatCurrency(marketplace.idealSellingPrice)}</span></p>
            </div>
        </div>
    );
};

const ViabilityAnalysisDisplay: React.FC<{ analysis: string }> = ({ analysis }) => {
    let icon: React.ReactNode;
    let colorClasses = '';
    let title = '';

    if (analysis.startsWith('Excelente')) {
        title = 'Recomendação';
        colorClasses = 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-400';
        icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
    } else if (analysis.startsWith('Viável')) {
        title = 'Recomendação';
        colorClasses = 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-400';
        icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>;
    } else if (analysis.startsWith('Não recomendado')) {
        title = 'Alerta';
        colorClasses = 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-400';
        icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
    } else { // Inviável
        title = 'Alerta';
        colorClasses = 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-400';
        icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>;
    }

    return (
        <div className={`mt-4 p-3 rounded-lg border-l-4 ${colorClasses} text-sm`}>
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    {icon}
                </div>
                <div className="ml-3">
                    <p className="font-semibold">{title}</p>
                    <p className="mt-1">{analysis}</p>
                </div>
            </div>
        </div>
    );
};


const MarketplaceCard: React.FC<{ marketplace: MarketplaceResult & { isExpanded: boolean }; isBestOption: boolean; onToggle: () => void; }> = ({ marketplace, isBestOption, onToggle }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const { isExpanded } = marketplace;

    const handleDownloadImage = async () => {
        if (!cardRef.current) return;

        setIsGenerating(true);

        try {
            const canvas = await html2canvas(cardRef.current, {
                useCORS: true,
                scale: 2,
                backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
            });
            const image = canvas.toDataURL('image/png', 1.0);
            
            const link = document.createElement('a');
            link.href = image;
            link.download = `${marketplace.name.toLowerCase().replace(/\s+/g, '-')}-analise.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Erro ao gerar a imagem:', error);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const isProfitable = marketplace.profitMargin > 0;
    const profitMarginColor = isProfitable ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400';

    return (
        <div ref={cardRef} className="relative bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 flex flex-col justify-between transition-all duration-300 border-2 border-transparent hover:border-blue-500">
            {isBestOption && (
                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg z-10">
                    Melhor Opção
                </div>
            )}
            <div>
                <h4 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-4">{marketplace.name}</h4>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span>Taxas Totais (Comissão + Pag.):</span> <span className="font-medium">{formatPercentage((marketplace.feeRate + marketplace.paymentFeeRate) * 100)} ({formatCurrency(marketplace.marketplaceFeeValue + marketplace.paymentFeeValue)})</span></div>
                    <div className="flex justify-between"><span>Custo de Frete:</span> <span className="font-medium">{formatCurrency(marketplace.shippingCost)}</span></div>
                    <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2 mt-2"><span>Custos Totais:</span> <span className="font-semibold">{formatCurrency(marketplace.totalCosts)}</span></div>
                    <div className="flex justify-between font-bold text-lg items-center">
                        <span className="flex items-center">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            Lucro Líquido:
                        </span> 
                        <span>{formatCurrency(marketplace.netProfit)}</span>
                    </div>
                    <div className={`flex justify-between font-bold text-lg items-center ${profitMarginColor}`}>
                        <span className="flex items-center">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                             Margem de Lucro:
                        </span>
                        <span>{formatPercentage(marketplace.profitMargin)}</span>
                    </div>
                </div>
                 <ViabilityAnalysisDisplay analysis={marketplace.viabilityAnalysis} />

                 {isExpanded && <FinancialDetails marketplace={marketplace} />}

                 <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center space-x-6">
                    <button onClick={onToggle} className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={isExpanded ? "M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 9v3m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                        </svg>
                        {isExpanded ? 'Ocultar Detalhes' : 'Ver Detalhes'}
                    </button>
                    
                    <button 
                        onClick={handleDownloadImage} 
                        disabled={isGenerating}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:underline disabled:opacity-50 disabled:cursor-wait flex items-center transition-colors"
                    >
                        {isGenerating ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Gerando...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Baixar Análise
                            </>
                        )}
                    </button>
                 </div>
            </div>
        </div>
    );
};

const SimulationsCard: React.FC<{ results: CalculationResults; formData: FormData }> = ({ results, formData }) => {
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
                          const newSellingPrice = formData.sellingPrice * (1 - discount / 100);
                          const taxValue = newSellingPrice * results.aiResponse.taxRate;
                          const marketplaceFeeValue = newSellingPrice * mp.feeRate;
                          const paymentFeeValue = newSellingPrice * mp.paymentFeeRate;
                          const returnCost = newSellingPrice * (formData.returnRate / 100);
                          const fixedCosts = formData.storage + formData.marketing + formData.adFee;
                          const baseVariableCosts = formData.acquisition + formData.packagingCost + mp.shippingCost;
                          const totalCosts = fixedCosts + baseVariableCosts + taxValue + marketplaceFeeValue + paymentFeeValue + returnCost;
                          const newNetProfitPerUnit = newSellingPrice - totalCosts;
                          const totalProjectedProfit = newNetProfitPerUnit * quantity;

                          return (
                              <li key={mp.name} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                  <p className="font-bold">{mp.name}</p>
                                  <div className="flex justify-between">
                                      <span>Lucro Total Projetado:</span>
                                      <span className={`font-bold ${totalProjectedProfit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(totalProjectedProfit)}</span>
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
    
    const InfoSection: React.FC<{ title: string, content: string | string[], icon: React.ReactNode}> = ({ title, content, icon }) => (
        <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center">
                {icon}
                <span className="ml-2">{title}</span>
            </h4>
            {Array.isArray(content) ? (
                 <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400 pl-2">
                    {content.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400 pl-2">{content}</p>
            )}
        </div>
    );

    return (
        <div className="space-y-4">
            <p className="text-center text-lg">
                Marketplace Recomendado: <span className="font-bold text-blue-600 dark:text-blue-400">{recommendedMarketplace}</span>
            </p>
            
            <InfoSection title="Justificativa" content={justification} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
            <InfoSection title="Estratégia de Preço" content={pricingStrategy} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" /><path d="M7 13h10M7 17h5" /></svg>} />
            <InfoSection title="Ações de Marketing" content={marketingActions} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-2.236 9.168-5.584C18.354 1.832 18 3.65 18 4.5v.553a2.25 2.25 0 01-4.5 0V5.5" /></svg>} />
            <InfoSection title="Logística e Embalagem" content={logisticsAndPackaging} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>} />
            <InfoSection title="Análise de Riscos" content={riskAnalysis} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />

            <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    <span className="ml-2">Cenários de Vendas Mensais</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Scenario title="Pessimista" data={salesScenarios.pessimistic} />
                    <Scenario title="Realista" data={salesScenarios.realistic} />
                    <Scenario title="Otimista" data={salesScenarios.optimistic} />
                </div>
            </div>
        </div>
    );
};


export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, isLoading, error, formData }) => {
  const [progress, setProgress] = useState(0);
  const [marketplaces, setMarketplaces] = useState<(MarketplaceResult & { isExpanded: boolean })[]>([]);

  useEffect(() => {
    if (results) {
      setMarketplaces(
        results.calculatedMarketplaces
          .sort((a, b) => b.netProfit - a.netProfit)
          .map(mp => ({ ...mp, isExpanded: false }))
      );
    }
  }, [results]);

  useEffect(() => {
    let timer: number;
    if (isLoading) {
      setProgress(0);
      setMarketplaces([]);
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

  const handleToggle = (name: string) => {
    setMarketplaces(prev =>
      prev.map(mp =>
        mp.name === name ? { ...mp, isExpanded: !mp.isExpanded } : mp
      )
    );
  };

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
  
  const { aiResponse } = results;
  const bestMarketplaceName = marketplaces.length > 0 ? marketplaces[0].name : '';

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

        {results && <SimulationsCard results={results} formData={formData} />}

        <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Comparativo de Marketplaces</h3>
            {marketplaces.map(mp => (
                <MarketplaceCard 
                    key={mp.name} 
                    marketplace={mp}
                    isBestOption={mp.name === bestMarketplaceName && mp.netProfit > 0}
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