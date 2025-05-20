import React, { useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

// Registrar componentes do Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface ResultsVisualizationProps {
  data: any[];
}

const ResultsVisualization: React.FC<ResultsVisualizationProps> = ({ data }) => {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  // Processar dados para visualização
  const processData = () => {
    // Contar tipos de picking
    const pickingTypes: {[key: string]: number} = {};
    data.forEach(item => {
      const type = item['Unnamed: 39'] || 'Não definido'; // Coluna AN (Novo Picking)
      pickingTypes[type] = (pickingTypes[type] || 0) + 1;
    });

    const labels = Object.keys(pickingTypes);
    const values = Object.values(pickingTypes);

    return {
      labels,
      datasets: [
        {
          label: 'Quantidade por Tipo de Picking',
          data: values,
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const chartData = processData();

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-semibold mb-4">Resultados do Dimensionamento</h2>
      
      <div className="mb-4">
        <div className="flex space-x-4">
          <button 
            className={`px-4 py-2 rounded ${chartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setChartType('bar')}
          >
            Gráfico de Barras
          </button>
          <button 
            className={`px-4 py-2 rounded ${chartType === 'pie' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setChartType('pie')}
          >
            Gráfico de Pizza
          </button>
        </div>
      </div>
      
      <div className="h-80">
        {chartType === 'bar' ? (
          <Bar 
            data={chartData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: true,
                  text: 'Distribuição por Tipo de Picking',
                },
              },
            }} 
          />
        ) : (
          <Pie 
            data={chartData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: true,
                  text: 'Distribuição por Tipo de Picking',
                },
              },
            }} 
          />
        )}
      </div>
      
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2">Resumo</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-100 p-3 rounded">
            <p className="text-sm text-gray-600">Total de Itens</p>
            <p className="text-xl font-bold">{data.length}</p>
          </div>
          <div className="bg-gray-100 p-3 rounded">
            <p className="text-sm text-gray-600">Tipos de Picking</p>
            <p className="text-xl font-bold">{Object.keys(chartData.labels).length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsVisualization;
