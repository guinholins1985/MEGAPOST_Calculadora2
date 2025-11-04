import React, { useState } from 'react';
import { FormData } from '../types';
import { autofillProductDetails } from '../services/geminiService';

interface InputFormProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onAnalyze: (data: FormData) => void;
  isLoading: boolean;
}

const brazilianMarketplaceCategories = [
    "Acessórios para Veículos", "Agro", "Alimentos e Bebidas", "Animais", "Antiguidades e Coleções", "Arte, Papelaria e Armarinho",
    "Bebês", "Beleza e Cuidado Pessoal", "Brinquedos e Hobbies", "Calçados, Roupas e Bolsas", "Câmeras e Acessórios",
    "Carros, Motos e Outros", "Casa, Móveis e Decoração", "Celulares e Telefones", "Construção", "Eletrodomésticos",
    "Eletrônicos, Áudio e Vídeo", "Esportes e Fitness", "Ferramentas", "Festas e Lembrancinhas", "Games",
    "Imóveis", "Indústria e Comércio", "Informática", "Ingressos", "Instrumentos Musicais", "Joias e Relógios",
    "Livros, Revistas e Comics", "Música, Filmes e Seriados", "Saúde", "Serviços", "Outras categorias"
];

const InputGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {children}
    </div>
  </div>
);

const InputField: React.FC<{ label: string; name: keyof FormData; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void; type?: string; placeholder?: string; step?: string; children?: React.ReactNode }> = ({ label, name, value, onChange, type = 'number', placeholder, step, children }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    {children ? (
       <select id={name} name={name} value={value} onChange={onChange} className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
         {children}
       </select>
    ) : (
      <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      step={step || (type === 'number' ? '0.01' : undefined)}
      min="0"
      className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      />
    )}
  </div>
);

export const InputForm: React.FC<InputFormProps> = ({ formData, setFormData, onAnalyze, isLoading }) => {
  const [productIdentifier, setProductIdentifier] = useState('');
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [autofillError, setAutofillError] = useState<string | null>(null);
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' && name !== 'destinationCep' ? parseFloat(value) || 0 : value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAutofill = async () => {
    if (!productIdentifier) {
      setAutofillError('Por favor, insira uma URL ou descrição.');
      return;
    }
    setIsAutofilling(true);
    setAutofillError(null);
    setProductImageUrl(null);
    try {
      const data = await autofillProductDetails(productIdentifier);
      const newFormData = {
        ...formData,
        category: data.category || formData.category,
        length: data.length || formData.length,
        width: data.width || formData.width,
        height: data.height || formData.height,
        weight: data.weight || formData.weight,
        variations: data.variations || formData.variations,
        sellingPrice: data.sellingPrice || formData.sellingPrice,
        acquisition: data.acquisition || formData.acquisition,
        packagingCost: data.packagingCost || formData.packagingCost,
        adFee: data.adFee || formData.adFee,
        marketing: data.marketing || formData.marketing,
        storage: data.storage || formData.storage,
        returnRate: data.returnRate || formData.returnRate,
      };
      setFormData(newFormData);
      setProductImageUrl(data.imageUrl || null);
      onAnalyze(newFormData); // Trigger analysis automatically
    } catch (err) {
      if (err instanceof Error) {
        setAutofillError(err.message);
      } else {
        setAutofillError('Ocorreu um erro desconhecido ao preencher os dados.');
      }
    } finally {
      setIsAutofilling(false);
    }
  };

  return (
    <div className="w-full lg:w-1/2 p-4 space-y-6">
      <InputGroup title="Dados do Produto">
        <div className="md:col-span-2">
            <label htmlFor="productIdentifier" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Importar por URL ou Descrever Produto</label>
            <div className="flex items-center space-x-2">
                <input
                    type="text"
                    id="productIdentifier"
                    name="productIdentifier"
                    value={productIdentifier}
                    onChange={(e) => setProductIdentifier(e.target.value)}
                    placeholder="Cole uma URL ou descreva. Ex: 'Smartphone Samsung S23 128GB'"
                    className="flex-grow bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                />
                <button
                    onClick={handleAutofill}
                    disabled={isAutofilling || isLoading}
                    className="text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-4 py-2.5 text-center dark:bg-green-500 dark:hover:bg-green-600 dark:focus:ring-green-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
                >
                    {isAutofilling ? (
                        <>
                           <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                           </svg>
                           Importando...
                        </>
                    ) : 'Importar e Analisar'}
                </button>
            </div>
             {autofillError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{autofillError}</p>}
        </div>

        <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Imagem do Produto</label>
            <div className="mt-1 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md h-48">
                {productImageUrl ? (
                    <div className="relative group">
                        <img src={productImageUrl} alt="Produto" className="max-h-40 rounded-lg object-contain" />
                        <div 
                            onClick={() => setProductImageUrl(null)} 
                            title="Remover imagem"
                            className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-600 text-white rounded-full p-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600 dark:text-gray-400">
                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                <span>Carregar um arquivo</span>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageUpload} accept="image/*" />
                            </label>
                            <p className="pl-1">ou arraste e solte</p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG, GIF</p>
                    </div>
                )}
            </div>
        </div>
        
        <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria do Produto</label>
            <input
              type="text"
              id="category"
              name="category"
              list="categories-datalist"
              value={formData.category}
              onChange={handleChange}
              placeholder="Ex: Eletrônicos"
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            />
            <datalist id="categories-datalist">
                {brazilianMarketplaceCategories.map(cat => <option key={cat} value={cat} />)}
            </datalist>
        </div>

        <InputField label="Preço de Venda (R$)" name="sellingPrice" value={formData.sellingPrice} onChange={handleChange} />
        <InputField label="Comprimento (cm)" name="length" value={formData.length} onChange={handleChange} />
        <InputField label="Largura (cm)" name="width" value={formData.width} onChange={handleChange} />
        <InputField label="Altura (cm)" name="height" value={formData.height} onChange={handleChange} />
        <InputField label="Peso (kg)" name="weight" value={formData.weight} onChange={handleChange} step="0.001" />

        {formData.variations && formData.variations.length > 0 && (
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Variações Encontradas</label>
                <div className="flex flex-wrap gap-2 p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                    {formData.variations.map((variation, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
                            {variation}
                        </span>
                    ))}
                </div>
            </div>
        )}
      </InputGroup>

      <InputGroup title="Custos, Taxas e Estratégia">
        <InputField label="Custo do Produto (Aquisição) (R$)" name="acquisition" value={formData.acquisition} onChange={handleChange} />
        <InputField label="Custo da Embalagem (R$)" name="packagingCost" value={formData.packagingCost} onChange={handleChange} />
        <InputField label="Taxa de Anúncio (R$)" name="adFee" value={formData.adFee} onChange={handleChange} />
        <InputField label="Custo com Marketing (R$)" name="marketing" value={formData.marketing} onChange={handleChange} />
        <InputField label="Custo de Armazenagem (R$)" name="storage" value={formData.storage} onChange={handleChange} />
        <InputField label="Taxa de Devolução (%)" name="returnRate" value={formData.returnRate} onChange={handleChange} />
        <InputField label="Margem de Lucro Desejada (%)" name="desiredProfitMargin" value={formData.desiredProfitMargin} onChange={handleChange} />
      </InputGroup>

      <InputGroup title="Localização e Frete">
        <InputField label="Estado (UF)" name="state" value={formData.state} onChange={handleChange}>
            <option value="">Selecione um estado</option>
            <option value="AC">Acre</option>
            <option value="AL">Alagoas</option>
            <option value="AP">Amapá</option>
            <option value="AM">Amazonas</option>
            <option value="BA">Bahia</option>
            <option value="CE">Ceará</option>
            <option value="DF">Distrito Federal</option>
            <option value="ES">Espírito Santo</option>
            <option value="GO">Goiás</option>
            <option value="MA">Maranhão</option>
            <option value="MT">Mato Grosso</option>
            <option value="MS">Mato Grosso do Sul</option>
            <option value="MG">Minas Gerais</option>
            <option value="PA">Pará</option>
            <option value="PB">Paraíba</option>
            <option value="PR">Paraná</option>
            <option value="PE">Pernambuco</option>
            <option value="PI">Piauí</option>
            <option value="RJ">Rio de Janeiro</option>
            <option value="RN">Rio Grande do Norte</option>
            <option value="RS">Rio Grande do Sul</option>
            <option value="RO">Rondônia</option>
            <option value="RR">Roraima</option>
            <option value="SC">Santa Catarina</option>
            <option value="SP">São Paulo</option>
            <option value="SE">Sergipe</option>
            <option value="TO">Tocantins</option>
        </InputField>
        <InputField label="CEP de Destino para Simulação" name="destinationCep" value={formData.destinationCep} onChange={handleChange} type="text" placeholder="Ex: 01001-000" />
      </InputGroup>
      
      <div className="pt-4 sticky bottom-0 bg-gray-50 dark:bg-gray-900 py-4">
        <button
          onClick={() => onAnalyze(formData)}
          disabled={isLoading || isAutofilling}
          className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-lg px-5 py-3 text-center dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analisando...
            </>
          ) : (
            'Analisar Lucratividade'
          )}
        </button>
      </div>
    </div>
  );
};