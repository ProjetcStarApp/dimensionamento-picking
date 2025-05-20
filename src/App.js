import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import ParameterEditor from './components/ParameterEditor';
import ResultsVisualization from './components/ResultsVisualization';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [parameters, setParameters] = useState({
    'Módulo Inteiro - Cubagem (m³)': 1.72,
    'Módulo Inteiro - Freq. MÁX Abast (dias)': 3,
    'Meio Palete - Cubagem (m³)': 0.86,
    'Meio Palete - Freq. MÁX Abast (dias)': 12,
    '4P Aramado - Cubagem (m³)': 0.215,
    '4P Aramado - Freq. MÁX Abast (dias)': 18,
    '8P Aramado - Cubagem (m³)': 0.1075,
    '8P Aramado - Freq. MÁX Abast (dias)': 24
  });

  const handleDataLoaded = (loadedData) => {
    setData(loadedData);
    processData(loadedData);
  };

  const handleParametersChanged = (newParameters) => {
    setParameters(newParameters);
    processData(data, newParameters);
  };

  const processData = (items, params = parameters) => {
    if (!items || items.length === 0) return;
    
    // Processar os dados com base nos parâmetros
    const processed = items.map(item => {
      // Usar mapeamento de colunas se disponível
      const columnMapping = item._columnMapping;
      let saidaCubicaDia = 0;
      
      if (columnMapping) {
        saidaCubicaDia = parseFloat(item[columnMapping.dailyCubicOutput]) || 0;
      } else {
        // Fallback para coluna padrão
        const keys = Object.keys(item);
        const cubicKey = keys.find(k => 
          k.toLowerCase().includes('cubic') || 
          k.toLowerCase().includes('saída') || 
          k.toLowerCase().includes('saida') ||
          k.toLowerCase().includes('volume')
        );
        saidaCubicaDia = cubicKey ? parseFloat(item[cubicKey]) || 0 : 0;
      }
      
      // Calcular consumo máximo para cada tipo de picking
      const meioModuloConsumoMax = params['Módulo Inteiro - Cubagem (m³)'] / params['Módulo Inteiro - Freq. MÁX Abast (dias)'];
      const meioPaleteConsumoMax = params['Meio Palete - Cubagem (m³)'] / params['Meio Palete - Freq. MÁX Abast (dias)'];
      const aramado4pConsumoMax = params['4P Aramado - Cubagem (m³)'] / params['4P Aramado - Freq. MÁX Abast (dias)'];
      const aramado8pConsumoMax = params['8P Aramado - Cubagem (m³)'] / params['8P Aramado - Freq. MÁX Abast (dias)'];
      
      // Lógica de decisão baseada no consumo diário
      let pickingType;
      if (saidaCubicaDia > meioModuloConsumoMax) {
        pickingType = 'Modulo inteiro';
      } else if (saidaCubicaDia > meioPaleteConsumoMax) {
        pickingType = 'Meio palete';
      } else if (saidaCubicaDia > aramado4pConsumoMax) {
        pickingType = '4P - Aramado';
      } else if (saidaCubicaDia > aramado8pConsumoMax) {
        pickingType = '8P - Aramado';
      } else {
        pickingType = 'Duplo';
      }
      
      return {
        ...item,
        calculatedPickingType: pickingType,
        saidaCubicaDia: saidaCubicaDia
      };
    });
    
    setProcessedData(processed);
  };

  return (
    <div className="App">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="container">
        {activeTab === 'dashboard' && (
          <div className="dashboard-container">
            <h2>Dashboard de Dimensionamento de Picking</h2>
            <div className="dashboard-summary">
              <div className="card">
                <h3>Resumo</h3>
                <p>Esta ferramenta permite dimensionar endereços de picking com base nos parâmetros definidos.</p>
                <p>Para começar, faça upload do arquivo Excel na aba "Base de Dados".</p>
              </div>
              
              {processedData.length > 0 && (
                <ResultsVisualization data={processedData} />
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'data' && (
          <div className="data-container">
            <h2>Base de Dados</h2>
            <FileUpload onDataLoaded={handleDataLoaded} />
            
            {data.length > 0 && (
              <div className="data-preview card">
                <h3>Dados Carregados</h3>
                <p>Total de itens: {data.length}</p>
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Departamento</th>
                      <th>Saída Cúbica/Dia</th>
                      <th>Tipo de Picking</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedData.slice(0, 10).map((item, index) => (
                      <tr key={index}>
                        <td>{item._mappedProductCode || 'N/A'}</td>
                        <td>{item._mappedDepartment || 'N/A'}</td>
                        <td>{item.saidaCubicaDia?.toFixed(6) || 'N/A'}</td>
                        <td>{item.calculatedPickingType || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {processedData.length > 10 && <p>Mostrando 10 de {processedData.length} itens...</p>}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'parameters' && (
          <div className="parameters-container">
            <h2>Parâmetros</h2>
            <ParameterEditor 
              parameters={parameters} 
              onParametersChanged={handleParametersChanged} 
            />
          </div>
        )}
        
        {activeTab === 'simulation' && (
          <div className="simulation-container">
            <h2>Simulação</h2>
            {processedData.length > 0 ? (
              <ResultsVisualization data={processedData} showDetails={true} />
            ) : (
              <div className="card">
                <p>Faça upload dos dados na aba "Base de Dados" para iniciar a simulação.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
