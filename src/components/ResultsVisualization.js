import React from 'react';

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

export default ResultsVisualization;
