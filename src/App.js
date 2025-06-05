import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import * as XLSX from 'xlsx';

// Registrar componentes do Chart.js
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Componentes
const Header = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'data', label: 'Base de Dados' },
    { id: 'parameters', label: 'Parâmetros' },
    { id: 'simulation', label: 'Simulação' },
    { id: 'details', label: 'Detalhes' }
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
  const [selectedSheet, setSelectedSheet] = useState('');
  const [availableSheets, setAvailableSheets] = useState([]);

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setFileName(file.name);
    setLoading(true);
    setError('');

    // Processar arquivo Excel real
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Obter lista de planilhas disponíveis
        const sheets = workbook.SheetNames;
        setAvailableSheets(sheets);
        
        if (sheets.length > 0) {
          // Se houver uma planilha chamada "base", selecione-a automaticamente
          const baseSheetIndex = sheets.findIndex(sheet => 
            sheet.toLowerCase() === 'base' || 
            sheet.toLowerCase().includes('base')
          );
          
          const sheetToSelect = baseSheetIndex >= 0 ? sheets[baseSheetIndex] : sheets[0];
          setSelectedSheet(sheetToSelect);
          
          // Processar a planilha selecionada
          processSheet(workbook, sheetToSelect);
        } else {
          setError('O arquivo Excel não contém planilhas.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Erro ao processar arquivo:', err);
        setError(`Erro ao processar o arquivo: ${err.message}`);
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Erro ao ler o arquivo.');
      setLoading(false);
    };
    
    reader.readAsArrayBuffer(file);
  };

  const processSheet = (workbook, sheetName) => {
    try {
      // Converter a planilha para JSON
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      
      // Verificar se há dados
      if (jsonData.length < 2) {
        setError('A planilha não contém dados suficientes.');
        setLoading(false);
        return;
      }
      
      // Extrair cabeçalhos (primeira linha)
      const headers = jsonData[0].map(header => header.toString().trim());
      
      // Verificar se há cabeçalhos válidos
      if (headers.filter(h => h).length === 0) {
        setError('A planilha não contém cabeçalhos válidos.');
        setLoading(false);
        return;
      }
      
      // Converter dados para array de objetos
      const data = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowData = {};
        
        // Pular linhas vazias
        if (row.every(cell => !cell)) continue;
        
        // Mapear células para propriedades usando cabeçalhos
        headers.forEach((header, index) => {
          if (header) {
            rowData[header] = row[index];
          }
        });
        
        data.push(rowData);
      }
      
      // Atualizar estado
      setHeaders(headers.filter(h => h));
      setRawData(data);
      setShowMapper(true);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao processar planilha:', err);
      setError(`Erro ao processar a planilha: ${err.message}`);
      setLoading(false);
    }
  };

  const handleSheetChange = (e) => {
    const selectedSheet = e.target.value;
    setSelectedSheet(selectedSheet);
    
    // Reprocessar o arquivo com a nova planilha selecionada
    const reader = new FileReader();
    const fileInput = document.querySelector('input[type="file"]');
    
    if (fileInput && fileInput.files.length > 0) {
      reader.onload = (evt) => {
        try {
          const data = evt.target.result;
          const workbook = XLSX.read(data, { type: 'array' });
          processSheet(workbook, selectedSheet);
        } catch (err) {
          setError(`Erro ao processar a planilha: ${err.message}`);
          setLoading(false);
        }
      };
      
      reader.readAsArrayBuffer(fileInput.files[0]);
    }
  };

  const handleMappingConfirmed = (mapping) => {
    // Processar os dados com o mapeamento confirmado
    const processedData = rawData.map(row => {
      // Criar um objeto com todas as colunas originais
      const processedRow = { ...row };
      
      // Adicionar propriedades especiais para as colunas mapeadas
      if (mapping.productCode) {
        processedRow._mappedProductCode = row[mapping.productCode];
      }
      
      if (mapping.department) {
        processedRow._mappedDepartment = row[mapping.department];
      }
      
      if (mapping.dailyCubicOutput) {
        processedRow._mappedDailyCubicOutput = row[mapping.dailyCubicOutput];
        // Converter para número se for string
        if (typeof processedRow._mappedDailyCubicOutput === 'string') {
          processedRow._mappedDailyCubicOutput = parseFloat(processedRow._mappedDailyCubicOutput.replace(',', '.')) || 0;
        }
      }
      
      // Adicionar o mapeamento para uso posterior
      processedRow._columnMapping = mapping;
      
      return processedRow;
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
    setAvailableSheets([]);
    setSelectedSheet('');
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
          
          {availableSheets.length > 0 && (
            <div className="sheet-selector">
              <label>Selecionar Planilha:</label>
              <select value={selectedSheet} onChange={handleSheetChange}>
                {availableSheets.map((sheet, index) => (
                  <option key={index} value={sheet}>{sheet}</option>
                ))}
              </select>
            </div>
          )}
        </>
      ) : (
        <ColumnMapper 
          headers={headers} 
          rawData={rawData}
          onMappingConfirmed={handleMappingConfirmed}
          onCancel={handleMappingCanceled}
        />
      )}
    </div>
  );
};

const ColumnMapper = ({ headers, rawData, onMappingConfirmed, onCancel }) => {
  // Estado para armazenar o mapeamento atual
  const [mapping, setMapping] = useState({
    productCode: '',
    department: '',
    dailyCubicOutput: '',
    // Adicionando campos opcionais para outras colunas que o usuário pode querer mapear
    description: '',
    category: '',
    supplier: '',
    stock: '',
    weight: '',
    dimensions: '',
    price: ''
  });

  // Estado para armazenar configurações salvas anteriormente
  const [savedMappings, setSavedMappings] = useState({});
  
  // Estado para controlar se o mapeamento automático foi aplicado
  const [autoDetected, setAutoDetected] = useState({
    productCode: false,
    department: false,
    dailyCubicOutput: false,
    description: false,
    category: false,
    supplier: false,
    stock: false,
    weight: false,
    dimensions: false,
    price: false
  });

  // Estado para mostrar/ocultar colunas adicionais
  const [showAdditionalColumns, setShowAdditionalColumns] = useState(false);

  // Estado para visualização prévia dos dados
  const [previewData, setPreviewData] = useState([]);

  // Função para detectar automaticamente as colunas
  const autoDetectColumns = useCallback(() => {
    const newMapping = { ...mapping };
    const newAutoDetected = { ...autoDetected };
    
    // Padrões para detecção automática (expandidos)
    const patterns = {
      productCode: ['cod', 'código', 'sku', 'id', 'produto', 'material', 'item', 'referência', 'ref'],
      department: ['depart', 'setor', 'área', 'categoria', 'grupo', 'mercearia', 'divisão', 'segmento'],
      dailyCubicOutput: ['saída', 'cubica', 'm³/dia', 'volume', 'consumo', 'saida cubica', 'demanda', 'giro'],
      description: ['desc', 'nome', 'título', 'denominação', 'especificação'],
      category: ['categ', 'tipo', 'classe', 'família', 'linha'],
      supplier: ['forn', 'vendor', 'distribuidor', 'fabricante'],
      stock: ['estoque', 'quantidade', 'inventário', 'disponível'],
      weight: ['peso', 'kg', 'massa'],
      dimensions: ['dimen', 'tamanho', 'medida', 'cm', 'mm'],
      price: ['preço', 'valor', 'custo', 'r$']
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
  useEffect(() => {
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
    
    // Preparar dados para visualização prévia
    if (rawData && rawData.length > 0) {
      setPreviewData(rawData.slice(0, 3));
    }
  }, [headers, autoDetectColumns, rawData]);
  
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
        dailyCubicOutput: false,
        description: false,
        category: false,
        supplier: false,
        stock: false,
        weight: false,
        dimensions: false,
        price: false
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
    // Verificar se todos os campos obrigatórios foram mapeados
    if (!mapping.productCode || !mapping.department || !mapping.dailyCubicOutput) {
      alert('Por favor, mapeie todas as colunas obrigatórias (Código do Produto, Departamento e Saída Cúbica/Dia).');
      return;
    }
    
    // Salvar o mapeamento atual como padrão
    saveMapping();
    
    // Chamar callback com o mapeamento confirmado
    onMappingConfirmed(mapping);
  };

  // Campos obrigatórios
  const requiredFields = [
    { id: 'productCode', label: 'Código do Produto/Material' },
    { id: 'department', label: 'Departamento/Setor' },
    { id: 'dailyCubicOutput', label: 'Saída Cúbica/Dia' }
  ];

  // Campos opcionais
  const optionalFields = [
    { id: 'description', label: 'Descrição' },
    { id: 'category', label: 'Categoria' },
    { id: 'supplier', label: 'Fornecedor' },
    { id: 'stock', label: 'Estoque' },
    { id: 'weight', label: 'Peso' },
    { id: 'dimensions', label: 'Dimensões' },
    { id: 'price', label: 'Preço' }
  ];

  return (
    <div className="card column-mapper">
      <h3>Mapeamento de Colunas</h3>
      
      <p className="info-text">
        Por favor, mapeie as colunas necessárias para o cálculo de dimensionamento.
        O sistema tentou detectar automaticamente algumas colunas (destacadas em azul).
        <br />
        <strong>Campos obrigatórios:</strong> Código do Produto, Departamento e Saída Cúbica/Dia.
      </p>
      
      <div className="preview-section">
        <h4>Visualização dos Dados</h4>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                {headers.map((header, index) => (
                  <th key={index}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {headers.map((header, colIndex) => (
                    <td key={colIndex}>{row[header]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="preview-note">Mostrando {previewData.length} de {rawData.length} registros</p>
      </div>
      
      <div className="mapping-form">
        <h4>Campos Obrigatórios</h4>
        {requiredFields.map((field) => (
          <div className="mapping-item" key={field.id}>
            <label>{field.label}:</label>
            <select 
              className={autoDetected[field.id] ? 'auto-detected' : ''}
              value={mapping[field.id]}
              onChange={(e) => handleMappingChange(field.id, e.target.value)}
            >
              <option value="">Selecione uma coluna</option>
              {headers.map((header, index) => (
                <option key={index} value={header}>{header}</option>
              ))}
            </select>
          </div>
        ))}
        
        <div className="toggle-additional">
          <button 
            onClick={() => setShowAdditionalColumns(!showAdditionalColumns)}
            className="secondary-button"
          >
            {showAdditionalColumns ? 'Ocultar Campos Adicionais' : 'Mostrar Campos Adicionais'}
          </button>
        </div>
        
        {showAdditionalColumns && (
          <>
            <h4>Campos Adicionais (Opcionais)</h4>
            {optionalFields.map((field) => (
              <div className="mapping-item" key={field.id}>
                <label>{field.label}:</label>
                <select 
                  className={autoDetected[field.id] ? 'auto-detected' : ''}
                  value={mapping[field.id]}
                  onChange={(e) => handleMappingChange(field.id, e.target.value)}
                >
                  <option value="">Selecione uma coluna</option>
                  {headers.map((header, index) => (
                    <option key={index} value={header}>{header}</option>
                  ))}
                </select>
              </div>
            ))}
          </>
        )}
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
                {/* Dados calculados por departamento */}
                {(() => {
                  // Obter departamentos únicos
                  const departments = [...new Set(data.map(item => item._mappedDepartment))].filter(Boolean);
                  
                  // Calcular contagens por departamento e tipo de picking
                  return departments.map((dept, index) => {
                    const deptItems = data.filter(item => item._mappedDepartment === dept);
                    
                    // Contar itens por tipo de picking
                    const moduloInteiro = deptItems.filter(item => item.calculatedPickingType === 'Modulo inteiro').length;
                    const meioPalete = deptItems.filter(item => item.calculatedPickingType === 'Meio palete').length;
                    const aramado4p = deptItems.filter(item => item.calculatedPickingType === '4P - Aramado').length;
                    const aramado8p = deptItems.filter(item => item.calculatedPickingType === '8P - Aramado').length;
                    const duplo = deptItems.filter(item => item.calculatedPickingType === 'Duplo').length;
                    
                    return (
                      <tr key={index}>
                        <td>{dept}</td>
                        <td>{moduloInteiro}</td>
                        <td>{meioPalete}</td>
                        <td>{aramado4p}</td>
                        <td>{aramado8p}</td>
                        <td>{duplo}</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Novo componente para visualização detalhada por item e departamento
const DetailedResults = ({ data }) => {
  const [sortField, setSortField] = useState('_mappedProductCode');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterPickingType, setFilterPickingType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Função para exportar para Excel
  const exportToExcel = () => {
    if (!data || data.length === 0) {
      alert('Não há dados para exportar.');
      return;
    }
    
    // Preparar dados para exportação
    const exportData = data.map(item => {
      // Criar objeto base com as colunas mapeadas
      const exportRow = {
        'Código': item._mappedProductCode || '',
        'Departamento': item._mappedDepartment || '',
        'Saída Cúbica/Dia': item._mappedDailyCubicOutput || 0,
        'Tipo de Picking': item.calculatedPickingType || ''
      };
      
      // Adicionar outras colunas mapeadas se existirem
      if (item._columnMapping) {
        const mapping = item._columnMapping;
        
        if (mapping.description && item[mapping.description]) {
          exportRow['Descrição'] = item[mapping.description];
        }
        
        if (mapping.category && item[mapping.category]) {
          exportRow['Categoria'] = item[mapping.category];
        }
        
        if (mapping.supplier && item[mapping.supplier]) {
          exportRow['Fornecedor'] = item[mapping.supplier];
        }
        
        if (mapping.stock && item[mapping.stock]) {
          exportRow['Estoque'] = item[mapping.stock];
        }
        
        if (mapping.weight && item[mapping.weight]) {
          exportRow['Peso'] = item[mapping.weight];
        }
        
        if (mapping.dimensions && item[mapping.dimensions]) {
          exportRow['Dimensões'] = item[mapping.dimensions];
        }
        
        if (mapping.price && item[mapping.price]) {
          exportRow['Preço'] = item[mapping.price];
        }
      }
      
      return exportRow;
    });
    
    // Criar workbook e worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dimensionamento');
    
    // Salvar arquivo
    XLSX.writeFile(wb, 'dimensionamento_picking.xlsx');
  };
  
  // Função para ordenar dados
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Obter departamentos únicos para filtro
  const departments = [...new Set(data.map(item => item._mappedDepartment))].filter(Boolean);
  
  // Obter tipos de picking únicos para filtro
  const pickingTypes = [...new Set(data.map(item => item.calculatedPickingType))].filter(Boolean);
  
  // Filtrar e ordenar dados
  const filteredData = data.filter(item => {
    if (filterDepartment && item._mappedDepartment !== filterDepartment) return false;
    if (filterPickingType && item.calculatedPickingType !== filterPickingType) return false;
    return true;
  }).sort((a, b) => {
    let valueA, valueB;
    
    // Determinar valores para comparação
    if (sortField === '_mappedProductCode') {
      valueA = a._mappedProductCode || '';
      valueB = b._mappedProductCode || '';
    } else if (sortField === '_mappedDepartment') {
      valueA = a._mappedDepartment || '';
      valueB = b._mappedDepartment || '';
    } else if (sortField === '_mappedDailyCubicOutput') {
      valueA = a._mappedDailyCubicOutput || 0;
      valueB = b._mappedDailyCubicOutput || 0;
    } else if (sortField === 'calculatedPickingType') {
      valueA = a.calculatedPickingType || '';
      valueB = b.calculatedPickingType || '';
    }
    
    // Comparar valores
    if (typeof valueA === 'number') {
      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    } else {
      return sortDirection === 'asc' 
        ? valueA.toString().localeCompare(valueB.toString())
        : valueB.toString().localeCompare(valueA.toString());
    }
  });
  
  // Calcular estatísticas por departamento
  const departmentStats = departments.map(dept => {
    const deptItems = data.filter(item => item._mappedDepartment === dept);
    const pickingCounts = {};
    
    pickingTypes.forEach(type => {
      pickingCounts[type] = deptItems.filter(item => item.calculatedPickingType === type).length;
    });
    
    return {
      department: dept,
      totalItems: deptItems.length,
      pickingCounts
    };
  });
  
  // Preparar dados para gráficos
  const pieChartData = {
    labels: pickingTypes,
    datasets: [
      {
        data: pickingTypes.map(type => 
          data.filter(item => item.calculatedPickingType === type).length
        ),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF'
        ]
      }
    ]
  };
  
  const barChartData = {
    labels: departments,
    datasets: pickingTypes.map((type, index) => ({
      label: type,
      data: departments.map(dept => 
        data.filter(item => 
          item._mappedDepartment === dept && item.calculatedPickingType === type
        ).length
      ),
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF'
      ][index % 5]
    }))
  };
  
  // Paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  // Navegação de páginas
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  if (!data || data.length === 0) {
    return (
      <div className="card">
        <h3>Sem dados para visualização</h3>
        <p>Faça upload dos dados na aba "Base de Dados".</p>
      </div>
    );
  }
  
  return (
    <div className="detailed-results">
      <div className="card">
        <h3>Visualização Detalhada</h3>
        
        <div className="filters">
          <div className="filter-group">
            <label>Filtrar por Departamento:</label>
            <select 
              value={filterDepartment} 
              onChange={(e) => {
                setFilterDepartment(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Todos</option>
              {departments.map((dept, index) => (
                <option key={index} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Filtrar por Tipo de Picking:</label>
            <select 
              value={filterPickingType} 
              onChange={(e) => {
                setFilterPickingType(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Todos</option>
              {pickingTypes.map((type, index) => (
                <option key={index} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <button onClick={exportToExcel} className="export-button">
            Exportar para Excel
          </button>
        </div>
        
        <h4>Resultados por Item</h4>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('_mappedProductCode')} className="sortable">
                  Código {sortField === '_mappedProductCode' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('_mappedDepartment')} className="sortable">
                  Departamento {sortField === '_mappedDepartment' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('_mappedDailyCubicOutput')} className="sortable">
                  Saída Cúbica/Dia {sortField === '_mappedDailyCubicOutput' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('calculatedPickingType')} className="sortable">
                  Tipo de Picking {sortField === 'calculatedPickingType' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item, index) => (
                <tr key={index}>
                  <td>{item._mappedProductCode || 'N/A'}</td>
                  <td>{item._mappedDepartment || 'N/A'}</td>
                  <td>{typeof item._mappedDailyCubicOutput === 'number' ? item._mappedDailyCubicOutput.toFixed(6) : 'N/A'}</td>
                  <td>{item.calculatedPickingType || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Paginação */}
        <div className="pagination">
          <button 
            onClick={() => paginate(currentPage - 1)} 
            disabled={currentPage === 1}
            className="pagination-button"
          >
            Anterior
          </button>
          <span className="page-info">
            Página {currentPage} de {totalPages}
          </span>
          <button 
            onClick={() => paginate(currentPage + 1)} 
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Próxima
          </button>
        </div>
      </div>
      
      <div className="card">
        <h3>Consolidação por Departamento</h3>
        
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Departamento</th>
                <th>Total de Itens</th>
                {pickingTypes.map((type, index) => (
                  <th key={index}>{type}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {departmentStats.map((stat, index) => (
                <tr key={index}>
                  <td>{stat.department}</td>
                  <td>{stat.totalItems}</td>
                  {pickingTypes.map((type, typeIndex) => (
                    <td key={typeIndex}>{stat.pickingCounts[type] || 0}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="charts-container">
          <div className="chart-wrapper">
            <h4>Distribuição por Tipo de Picking</h4>
            <div className="pie-chart">
              <Pie data={pieChartData} options={{ responsive: true }} />
            </div>
          </div>
          
          <div className="chart-wrapper">
            <h4>Distribuição por Departamento</h4>
            <div className="bar-chart">
              <Bar 
                data={barChartData} 
                options={{
                  responsive: true,
                  scales: {
                    x: { stacked: true },
                    y: { stacked: true }
                  }
                }} 
              />
            </div>
          </div>
        </div>
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
      
      if (columnMapping && columnMapping.dailyCubicOutput) {
        const rawValue = item[columnMapping.dailyCubicOutput];
        saidaCubicaDia = typeof rawValue === 'number' ? rawValue : parseFloat(String(rawValue).replace(',', '.')) || 0;
      } else {
        // Fallback para coluna padrão
        const keys = Object.keys(item);
        const cubicKey = keys.find(k => 
          k.toLowerCase().includes('cubic') || 
          k.toLowerCase().includes('saída') || 
          k.toLowerCase().includes('saida') ||
          k.toLowerCase().includes('volume')
        );
        saidaCubicaDia = cubicKey ? parseFloat(String(item[cubicKey]).replace(',', '.')) || 0 : 0;
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
        _mappedDailyCubicOutput: saidaCubicaDia
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
                        <td>{typeof item._mappedDailyCubicOutput === 'number' ? item._mappedDailyCubicOutput.toFixed(6) : 'N/A'}</td>
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
        
        {activeTab === 'details' && (
          <div className="details-container">
            <h2>Detalhes</h2>
            {processedData.length > 0 ? (
              <DetailedResults data={processedData} />
            ) : (
              <div className="card">
                <p>Faça upload dos dados na aba "Base de Dados" para visualizar os detalhes.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
