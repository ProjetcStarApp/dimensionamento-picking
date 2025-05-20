import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import ColumnMapper, { ColumnMapping } from './ColumnMapper';

interface FileUploadProps {
  onDataLoaded: (data: any[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [fileName, setFileName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);
  const [showMapper, setShowMapper] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setFileName(file.name);
    setLoading(true);
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Assumindo que queremos a aba "Base"
        const sheetName = workbook.SheetNames.find(name => name === 'Base') || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          setError('O arquivo não contém dados.');
          setLoading(false);
          return;
        }
        
        // Extrair cabeçalhos (nomes das colunas)
        const headers = Object.keys(jsonData[0]);
        setHeaders(headers);
        setRawData(jsonData);
        
        // Mostrar o mapeador de colunas
        setShowMapper(true);
        setLoading(false);
      } catch (err) {
        setError('Erro ao processar o arquivo. Verifique se é um arquivo Excel válido.');
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Erro ao ler o arquivo.');
      setLoading(false);
    };

    reader.readAsBinaryString(file);
  };

  const handleMappingConfirmed = (mapping: ColumnMapping) => {
    // Processar os dados com o mapeamento confirmado
    const processedData = rawData.map(row => {
      // Criar um novo objeto com as colunas mapeadas
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
    <div className="p-4 bg-white rounded-lg shadow-md">
      {!showMapper ? (
        <>
          <h2 className="text-xl font-semibold mb-4">Importar Dados</h2>
          <div className="flex items-center space-x-2">
            <label className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded cursor-pointer">
              Selecionar Arquivo
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <span className="text-gray-600">{fileName || 'Nenhum arquivo selecionado'}</span>
          </div>
          {loading && <p className="mt-2 text-blue-600">Carregando...</p>}
          {error && <p className="mt-2 text-red-600">{error}</p>}
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
