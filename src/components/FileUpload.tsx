import React, { useState } from 'react';
import ColumnMapper from './ColumnMapper';

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

export default FileUpload;
