import React, { useState } from 'react';
import './App.css';

// Componentes
const Header = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'data', label: 'Base de Dados' },
    { id: 'parameters', label: 'Parâmetros' },
    { id: 'simulation', label: 'Simulação' }
  ];

  return (
    <header className="App-header">
      <h1>Dimensionamento de Picking</h1>
      <div className="nav-tabs">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>
    </header>
  );
};

const FileUpload = ({ onDataLoaded }) => {
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [headers, setHeaders] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [showMapper, setShowMapper] = useState(false);

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setFileName(file.name);
    setLoading(true);
    setError('');

    // Simular processamento de arquivo Excel
    setTimeout(() => {
      try {
        // Dados simulados
        const sampleData = [
          {
            "Código": "1001",
            "Departamento": "Alimentos",
            "Saída Cúbica/Dia": 0.025492
          },
          {
            "Código": "1002",
            "Departamento": "Bebidas",
            "Saída Cúbica/Dia": 0.027583
          },
          {
            "Código": "1003",
            "Departamento": "Limpeza",
            "Saída Cúbica/Dia": 0.035492
          }
        ];
        
        // Extrair cabeçalhos
        const headers = Object.keys(sampleData[0]);
        setHeaders(headers);
        setRawData(sampleData);
        
        // Mostrar o mapeador de colunas
        setShowMapper(true);
        setLoading(false);
      } catch (err) {
        setError('Erro ao processar o arquivo. Por favor, tente novamente.');
        setLoading(false);
      }
    }, 1000);
  };

  const handleMappingConfirmed = (mapping) => {
    // Processar os dados com o mapeamento confirmado
    const processedData = rawData.map(row => {
      return {
        ...row,
        // Adicionar propriedades especiais para as colunas mapeadas
        '_mappedProductCode': row[mapping.productCode],
        '_mappedDepartment': row[mapping.department],
        '_mappedDailyCubicOutput': row[mapping.dailyCubicOutput],
        // Adicionar o mapeamento para uso posterior
        '_columnMapping': mapping
      };
    });
    
    // Fechar o mapeador
    setShowMapper(false);
    
    // Passar os dados processados para o callback
    onDataLoaded(processedData);
  };

  const handleMappingCanceled = () => {
    setShowMapper(false);
    setFileName('');
    setRawData([]);
    setHeaders([]);
  };

  return (
    <div className="card">
      {!showMapper ? (
        <>
          <h3>Importar Dados</h3>
          <div className="file-upload">
            <label className="file-upload-label">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="file-input"
              />
              <span className="file-button">Selecionar Arquivo</span>
            </label>
            <span className="file-name">{fileName || 'Nenhum arquivo selecionado'}</span>
          </div>
          {loading && <p className="loading">Carregando...</p>}
          {error && <p className="error">{error}</p>}
        </>
      ) : (
        <ColumnMapper 
          headers={headers} 
          onMappingConfirmed={handleMappingConfirmed}
          onCancel={handleMappingCanceled}
        />
      )}
    </div>
  );
};

const ColumnMapper = ({ headers, onMappingConfirmed, onCancel }) => {
  // Estado para armazenar o mapeamento atual
  const [mapping, setMapping] = useState({
    productCode: '',
    department: '',
    dailyCubicOutput: ''
  });

  // Estado para armazenar configurações salvas anteriormente
  const [savedMappings, setSavedMappings] = useState({});
  
  // Estado para controlar se o mapeamento automático foi aplicado
  const [autoDetected, setAutoDetected] = useState({
    productCode: false,
    department: false,
    dailyCubicOutput: false
  });

  // Função para detectar automaticamente as colunas
  const autoDetectColumns = React.useCallback(() => {
    const newMapping = { ...mapping };
    const newAutoDetected = { ...autoDetected };
    
    // Padrões para detecção automática
    const patterns = {
      productCode: ['cod', 'código', 'sku', 'id', 'produto', 'material', 'item'],
      department: ['depart', 'setor', 'área', 'categoria', 'grupo', 'mercearia'],
      dailyCubicOutput: ['saída', 'cubica', 'm³/dia', 'volume', 'consumo', 'saida cubica']
    };
    
    // Para cada campo necessário, procurar a melhor correspondência
    Object.entries(patterns).forEach(([field, keywords]) => {
      let bestMatch = '';
      let bestScore = 0;
      
      headers.forEach(header => {
        const headerLower = header.toLowerCase();
        
        // Calcular pontuação de similaridade
        let score = 0;
        keywords.forEach(keyword => {
          if (headerLower === keyword) {
            score += 10; // Correspondência exata
          } else if (headerLower.includes(keyword)) {
            score += 5; // Substring
          } else if (levenshteinDistance(headerLower, keyword) <= 2) {
            score += 3; // Distância de Levenshtein próxima
          }
        });
        
        // Se encontrou uma correspondência melhor, atualizar
        if (score > bestScore) {
          bestScore = score;
          bestMatch = header;
        }
      });
      
      // Se encontrou uma correspondência com pontuação mínima, aplicar
      if (bestScore >= 3) {
        newMapping[field] = bestMatch;
        newAutoDetected[field] = true;
      }
    });
    
    setMapping(newMapping);
    setAutoDetected(newAutoDetected);
  }, [headers, mapping, autoDetected]);
  
  // Carregar configurações salvas do localStorage ao inicializar
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('columnMappings');
      if (saved) {
        setSavedMappings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Erro ao carregar mapeamentos salvos:', error);
    }
    
    // Executar detecção automática
    autoDetectColumns();
  }, [headers, autoDetectColumns]);
  
  // Função auxiliar para calcular distância de Levenshtein (similaridade de texto)
  const levenshteinDistance = (a, b) => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    
    const matrix = [];
    
    // Inicializar matriz
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    // Preencher matriz
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        const cost = a[j - 1] === b[i - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // Deleção
          matrix[i][j - 1] + 1,      // Inserção
          matrix[i - 1][j - 1] + cost // Substituição
        );
      }
    }
    
    return matrix[b.length][a.length];
  };

  // Função para salvar o mapeamento atual
  const saveMapping = () => {
    try {
      const newSavedMappings = {
        ...savedMappings,
        default: mapping
      };
      localStorage.setItem('columnMappings', JSON.stringify(newSavedMappings));
      setSavedMappings(newSavedMappings);
      alert('Mapeamento salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar mapeamento:', error);
      alert('Erro ao salvar mapeamento.');
    }
  };

  // Função para carregar um mapeamento salvo
  const loadMapping = (key = 'default') => {
    if (savedMappings[key]) {
      setMapping(savedMappings[key]);
      setAutoDetected({
        productCode: false,
        department: false,
        dailyCubicOutput: false
      });
    }
  };

  // Função para lidar com mudanças nos campos de mapeamento
  const handleMappingChange = (field, value) => {
    setMapping(prev => ({
      ...prev,
      [field]: value
    }));
    setAutoDetected(prev => ({
      ...prev,
      [field]: false
    }));
  };

  // Função para confirmar o mapeamento
  const handleConfirm = () => {
    // Verificar se todos os campos necessários foram mapeados
    if (!mapping.productCode || !mapping.department || !mapping.dailyCubicOutput) {
      alert('Por favor, mapeie todas as colunas necessárias.');
      return;
    }
    
    // Salvar o mapeamento atual como padrão
    saveMapping();
    
    // Chamar callback com o mapeamento confirmado
    onMappingConfirmed(mapping);
  };

  return (
    <div className="card">
      <h3>Mapeamento de Colunas</h3>
      
      <p className="info-text">
        Por favor, mapeie as colunas necessárias para o cálculo de dimensionamento.
        O sistema tentou detectar automaticamente algumas colunas (destacadas em azul).
      </p>
      
      <div className="mapping-form">
        <div className="mapping-item">
          <label>Código do Produto/Material:</label>
          <select 
            className={autoDetected.productCode ? 'auto-detected' : ''}
            value={mapping.productCode}
            onChange={(e) => handleMappingChange('productCode', e.target.value)}
          >
            <option value="">Selecione uma coluna</option>
            {headers.map((header, index) => (
              <option key={index} value={header}>{header}</option>
            ))}
          </select>
        </div>
        
        <div className="mapping-item">
          <label>Departamento/Setor:</label>
          <select 
            className={autoDetected.department ? 'auto-detected' : ''}
            value={mapping.department}
            onChange={(e) => handleMappingChange('department', e.target.value)}
          >
            <option value="">Selecione uma coluna</option>
            {headers.map((header, index) => (
              <option key={index} value={header}>{header}</option>
            ))}
          </select>
        </div>
        
        <div className="mapping-item">
          <label>Saída Cúbica/Dia:</label>
          <select 
            className={autoDetected.dailyCubicOutput ? 'auto-detected' : ''}
            value={mapping.dailyCubicOutput}
            onChange={(e) => handleMappingChange('dailyCubicOutput', e.target.value)}
          >
            <option value="">Selecione uma coluna</option>
            {headers.map((header, index) => (
              <option key={index} value={header}>{header}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="button-group">
        <button onClick={autoDetectColumns} className="secondary-button">
          Detectar Automaticamente
        </button>
        
        {Object.keys(savedMappings).length > 0 && (
          <button onClick={() => loadMapping()} className="secondary-button">
            Carregar Mapeamento Salvo
          </button>
        )}
      </div>
      
      <div className="action-buttons">
        <button onClick={onCancel} className="cancel-button">
          Cancelar
        </button>
        <button onClick={handleConfirm} className="confirm-button">
          Confirmar Mapeamento
        </button>
      </div>
    </div>
  );
};

const ParameterEditor = ({ parameters, onParametersChanged }) => {
  const [localParameters, setLocalParameters] = useState(parameters);

  const handleParameterChange = (key, value) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      const newParameters = {
        ...localParameters,
        [key]: numValue
      };
      setLocalParameters(newParameters);
    }
  };

  const handleSave = () => {
    onParametersChanged(localParameters);
    alert('Parâmetros salvos com sucesso!');
  };

  const handleReset = () => {
    setLocalParameters(parameters);
  };

  return (
    <div className="card">
      <h3>Editar Parâmetros de Picking</h3>
      
      <div className="parameter-group">
        <h4>Módulo Inteiro</h4>
        <div className="parameter-item">
          <label>Cubagem (m³):</label>
          <input
            type="number"
            step="0.01"
            value={localParameters['Módulo Inteiro - Cubagem (m³)']}
            onChange={(e) => handleParameterChange('Módulo Inteiro - Cubagem (m³)', e.target.value)}
          />
        </div>
        <div className="parameter-item">
          <label>Frequência MÁX Abastecimento (dias):</label>
          <input
            type="number"
            step="1"
            value={localParameters['Módulo Inteiro - Freq. MÁX Abast (dias)']}
            onChange={(e) => handleParameterChange('Módulo Inteiro - Freq. MÁX Abast (dias)', e.target.value)}
          />
        </div>
      </div>
      
      <div className="parameter-group">
        <h4>Meio Palete</h4>
        <div className="parameter-item">
          <label>Cubagem (m³):</label>
          <input
            type="number"
            step="0.01"
            value={localParameters['Meio Palete - Cubagem (m³)']}
            onChange={(e) => handleParameterChange('Meio Palete - Cubagem (m³)', e.target.value)}
          />
        </div>
        <div className="parameter-item">
          <label>Frequência MÁX Abastecimento (dias):</label>
          <input
            type="number"
            step="1"
            value={localParameters['Meio Palete - Freq. MÁX Abast (dias)']}
            onChange={(e) => handleParameterChange('Meio Palete - Freq. MÁX Abast (dias)', e.target.value)}
          />
        </div>
      </div>
      
      <div className="parameter-group">
        <h4>4P - Aramado</h4>
        <div className="parameter-item">
          <label>Cubagem (m³):</label>
          <input
            type="number"
            step="0.01"
            value={localParameters['4P Aramado - Cubagem (m³)']}
            onChange={(e) => handleParameterChange('4P Aramado - Cubagem (m³)', e.target.value)}
          />
        </div>
        <div className="parameter-item">
          <label>Frequência MÁX Abastecimento (dias):</label>
          <input
            type="number"
            step="1"
            value={localParameters['4P Aramado - Freq. MÁX Abast (dias)']}
            onChange={(e) => handleParameterChange('4P Aramado - Freq. MÁX Abast (dias)', e.target.value)}
          />
        </div>
      </div>
      
      <div className="parameter-group">
        <h4>8P - Aramado</h4>
        <div className="parameter-item">
          <label>Cubagem (m³):</label>
          <input
            type="number"
            step="0.01"
            value={localParameters['8P Aramado - Cubagem (m³)']}
            onChange={(e) => handleParameterChange('8P Aramado - Cubagem (m³)', e.target.value)}
          />
        </div>
        <div className="parameter-item">
          <label>Frequência MÁX Abastecimento (dias):</label>
          <input
            type="number"
            step="1"
            value={localParameters['8P Aramado - Freq. MÁX Abast (dias)']}
            onChange={(e) => handleParameterChange('8P Aramado - Freq. MÁX Abast (dias)', e.target.value)}
          />
        </div>
      </div>
      
      <div className="action-buttons">
        <button onClick={handleReset} className="cancel-button">
          Restaurar
        </button>
        <button onClick={handleSave} className="confirm-button">
          Salvar Parâmetros
        </button>
      </div>
    </div>
  );
};

const ResultsVisualization = ({ data, showDetails = false }) => {
  // Calcular estatísticas
  const calculateStats = () => {
    if (!data || data.length === 0) return null;
    
    const pickingTypes = {};
    let totalItems = data.length;
    
    data.forEach(item => {
      const type = item.calculatedPickingType || 'Não definido';
      if (!pickingTypes[type]) {
        pickingTypes[type] = 0;
      }
      pickingTypes[type]++;
    });
    
    return {
      totalItems,
      pickingTypes
    };
  };
  
  const stats = calculateStats();
  
  if (!stats) {
    return (
      <div className="card">
        <h3>Sem dados para visualização</h3>
        <p>Faça upload dos dados na aba "Base de Dados".</p>
      </div>
    );
  }
  
  // Calcular percentuais para cada tipo de picking
  const pickingTypeStats = Object.entries(stats.pickingTypes).map(([type, count]) => ({
    type,
    count,
    percentage: (count / stats.totalItems * 100).toFixed(2)
  }));
  
  return (
    <div className="results-container">
      <div className="card">
        <h3>Resultados do Dimensionamento</h3>
        
        <div className="results-summary">
          <div className="result-card">
            <h4>Total de Itens</h4>
            <div className="result-value">{stats.totalItems}</div>
          </div>
          
          {pickingTypeStats.map((stat, index) => (
            <div className="result-card" key={index}>
              <h4>{stat.type}</h4>
              <div className="result-value">{stat.count}</div>
              <div className="result-percentage">{stat.percentage}%</div>
            </div>
          ))}
        </div>
        
        {showDetails && (
          <div className="results-details">
            <h4>Detalhes por Tipo de Picking</h4>
            <table>
              <thead>
                <tr>
                  <th>Tipo de Picking</th>
                  <th>Quantidade</th>
                  <th>Percentual</th>
                </tr>
              </thead>
              <tbody>
                {pickingTypeStats.map((stat, index) => (
                  <tr key={index}>
                    <td>{stat.type}</td>
                    <td>{stat.count}</td>
                    <td>{stat.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <h4>Distribuição por Departamento</h4>
            <table>
              <thead>
                <tr>
                  <th>Departamento</th>
                  <th>Módulo Inteiro</th>
                  <th>Meio Palete</th>
                  <th>4P - Aramado</th>
                  <th>8P - Aramado</th>
                  <th>Duplo</th>
                </tr>
              </thead>
              <tbody>
                {/* Dados simulados por departamento */}
                <tr>
                  <td>Alimentos</td>
                  <td>10</td>
                  <td>15</td>
                  <td>25</td>
                  <td>30</td>
                  <td>5</td>
                </tr>
                <tr>
                  <td>Bebidas</td>
                  <td>20</td>
                  <td>10</td>
                  <td>5</td>
                  <td>10</td>
                  <td>2</td>
                </tr>
                <tr>
                  <td>Limpeza</td>
                  <td>5</td>
                  <td>12</td>
                  <td>18</td>
                  <td>22</td>
                  <td>3</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente principal App
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
