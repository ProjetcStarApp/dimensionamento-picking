import React, { useState } from 'react';

interface ParameterEditorProps {
  parameters: {
    [key: string]: any;
  };
  onParametersChange: (newParameters: any) => void;
}

const ParameterEditor: React.FC<ParameterEditorProps> = ({ parameters, onParametersChange }) => {
  const [editedParameters, setEditedParameters] = useState(parameters);

  const handleInputChange = (key: string, value: any) => {
    const newParameters = { ...editedParameters, [key]: value };
    setEditedParameters(newParameters);
  };

  const handleSave = () => {
    onParametersChange(editedParameters);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-semibold mb-4">Parâmetros de Picking</h2>
      <div className="space-y-4">
        {Object.entries(parameters).map(([key, value]) => (
          <div key={key} className="grid grid-cols-2 gap-4">
            <label className="text-gray-700 font-medium">{key}</label>
            <input
              type={typeof value === 'number' ? 'number' : 'text'}
              value={editedParameters[key]}
              onChange={(e) => handleInputChange(key, e.target.value)}
              className="border rounded p-2"
              step={typeof value === 'number' ? '0.01' : undefined}
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleSave}
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
      >
        Aplicar Alterações
      </button>
    </div>
  );
};

export default ParameterEditor;
