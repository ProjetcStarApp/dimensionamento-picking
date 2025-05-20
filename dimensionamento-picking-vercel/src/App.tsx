import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import ParameterEditor from './components/ParameterEditor';
import ResultsVisualization from './components/ResultsVisualization';
import { processItems } from './lib/pickingCalculator';
import './App.css';

function App() {
  const [data, setData] = useState<any[]>([]);
  const [pickingParameters, setPickingParameters] = useState({
    'Duplo - Posições/Endereço': 0.5,
    'Módulo Inteiro - Posições/Endereço': 1,
    'Meio Palete - Posições/Endereço': 2,
    '4P Aramado - Posições/Endereço': 8,
    '8P Aramado - Posições/Endereço': 16,
    'Duplo - Freq. MÁX Abast (dias)': 0,
    'Módulo Inteiro - Freq. MÁX Abast (dias)': 3,
    'Meio Palete - Freq. MÁX Abast (dias)': 12,
    '4P Aramado - Freq. MÁX Abast (dias)': 18,
    '8P Aramado - Freq. MÁX Abast (dias)': 24,
    'Duplo - Cubagem (m³)': 3.44,
    'Módulo Inteiro - Cubagem (m³)': 1.72,
    'Meio Palete - Cubagem (m³)': 0.86,
    '4P Aramado - Cubagem (m³)': 0.215,
    '8P Aramado - Cubagem (m³)': 0.1075,
  });

  const [dimensionParameters, setDimensionParameters] = useState({
    'Aramado 2p - Comprimento (m)': 1,
    'Aramado 2p - Altura (m)': 0.38,
    'Aramado 2p - Largura (m)': 1.2,
    'Aramado 2p - Folga (%)': 0.8,
    'Aramado 4p - Comprimento (m)': 0.575,
    'Aramado 4p - Altura (m)': 0.38,
    'Aramado 4p - Largura (m)': 1.2,
    'Aramado 4p - Folga (%)': 0.8,
    'Aramado 8p - Comprimento (m)': 0.2875,
    'Aramado 8p - Altura (m)': 0.38,
    'Aramado 8p - Largura (m)': 1.2,
    'Aramado 8p - Folga (%)': 0.8,
    'Meio Módulo - Comprimento (m)': 1,
    'Meio Módulo - Altura (m)': 0.8,
    'Meio Módulo - Largura (m)': 1.2,
    'Meio Módulo - Folga (%)': 0.8,
    'Módulo Inteiro - Comprimento (m)': 1,
    'Módulo Inteiro - Altura (m)': 1.7,
    'Módulo Inteiro - Largura (m)': 1.2,
    'Módulo Inteiro - Folga (%)': 0.8,
  });

  const [processedData, setProcessedData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Processar dados quando os parâmetros ou dados mudam
  useEffect(() => {
    if (data.length > 0) {
      // Aplicar a lógica de cálculo baseada nas fórmulas do Excel
      const processed = processItems(data, pickingParameters, dimensionParameters);
      setProcessedData(processed);
    }
  }, [data, pickingParameters, dimensionParameters]);

  const handleDataLoaded = (newData: any[]) => {
    setData(newData);
  };

  const handlePickingParametersChange = (newParameters: any) => {
    setPickingParameters(newParameters);
  };

  const handleDimensionParametersChange = (newParameters: any) => {
    setDimensionParameters(newParameters);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto py-6 px-4">
        <div className="flex mb-6">
          <button 
            className={`px-4 py-2 mr-2 ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-gray-200'} rounded`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`px-4 py-2 mr-2 ${activeTab === 'data' ? 'bg-blue-600 text-white' : 'bg-gray-200'} rounded`}
            onClick={() => setActiveTab('data')}
          >
            Base de Dados
          </button>
          <button 
            className={`px-4 py-2 mr-2 ${activeTab === 'parameters' ? 'bg-blue-600 text-white' : 'bg-gray-200'} rounded`}
            onClick={() => setActiveTab('parameters')}
          >
            Parâmetros
          </button>
          <button 
            className={`px-4 py-2 ${activeTab === 'simulation' ? 'bg-blue-600 text-white' : 'bg-gray-200'} rounded`}
            onClick={() => setActiveTab('simulation')}
          >
            Simulação
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileUpload onDataLoaded={handleDataLoaded} />
            {processedData.length > 0 && <ResultsVisualization data={processedData} />}
          </div>
        )}

        {activeTab === 'data' && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-4">Base de Dados</h2>
            <FileUpload onDataLoaded={handleDataLoaded} />
            {data.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr>
                      {Object.keys(data[0]).slice(0, 10).map((key) => (
                        <th key={key} className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 10).map((row, index) => (
                      <tr key={index}>
                        {Object.keys(row).slice(0, 10).map((key) => (
                          <td key={key} className="py-2 px-4 border-b border-gray-200">
                            {row[key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-gray-600 text-sm">Mostrando 10 de {data.length} registros</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'parameters' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ParameterEditor 
              parameters={pickingParameters} 
              onParametersChange={handlePickingParametersChange} 
            />
            <ParameterEditor 
              parameters={dimensionParameters} 
              onParametersChange={handleDimensionParametersChange} 
            />
          </div>
        )}

        {activeTab === 'simulation' && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-4">Simulação de Cenários</h2>
            <p className="text-gray-600">
              Utilize esta seção para simular diferentes cenários de dimensionamento de picking.
              Ajuste os parâmetros e visualize o impacto nos resultados.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <ParameterEditor 
                parameters={pickingParameters} 
                onParametersChange={handlePickingParametersChange} 
              />
              {processedData.length > 0 && <ResultsVisualization data={processedData} />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
