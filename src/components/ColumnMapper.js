import React, { useState } from 'react';

// Interface para o mapeamento de colunas
export interface ColumnMapping {
  productCode: string;
  department: string;
  dailyCubicOutput: string;
}

interface ColumnMapperProps {
  headers: string[];
  onMappingConfirmed: (mapping: ColumnMapping) => void;
  onCancel: () => void;
}

const ColumnMapper: React.FC<ColumnMapperProps> = ({ headers, onMappingConfirmed, onCancel }) => {
  // Estado para armazenar o mapeamento atual
  const [mapping, setMapping] = useState<ColumnMapping>({
    productCode: '',
    department: '',
    dailyCubicOutput: ''
  });

  // Estado para armazenar configurações salvas anteriormente
  const [savedMappings, setSavedMappings] = useState<{[key: string]: ColumnMapping}>({});
  
  // Estado para controlar se o mapeamento automático foi aplicado
  const [autoDetected, setAutoDetected] = useState<{[key: string]: boolean}>({
    productCode: false,
    department: false,
    dailyCubicOutput: false
  });

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
  }, [headers]);

  // Função para detectar automaticamente as colunas
  const autoDetectColumns = () => {
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
        newMapping[field as keyof ColumnMapping] = bestMatch;
        newAutoDetected[field as keyof typeof newAutoDetected] = true;
      }
    });
    
    setMapping(newMapping);
    setAutoDetected(newAutoDetected);
  };
  
  // Função auxiliar para calcular distância de Levenshtein (similaridade de texto)
  const levenshteinDistance = (a: string, b: string): number => {
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
  const loadMapping = (key: string = 'default') => {
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
  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
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

export default ColumnMapper;
