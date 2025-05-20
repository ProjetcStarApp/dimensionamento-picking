import React, { useState } from 'react';

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

export default ParameterEditor;
