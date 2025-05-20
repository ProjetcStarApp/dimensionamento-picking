// Função para testar o mapeamento de colunas com diferentes estruturas
function testColumnMapping() {
  // Teste 1: Estrutura com nomes de colunas diferentes
  const testData1 = [
    {
      "Código SKU": "1001",
      "Categoria": "Alimentos",
      "Volume Diário (m³)": 0.025492
    },
    {
      "Código SKU": "1002",
      "Categoria": "Bebidas",
      "Volume Diário (m³)": 0.027583
    }
  ];
  
  // Teste 2: Estrutura com ordem de colunas diferente
  const testData2 = [
    {
      "Consumo m³/dia": 0.025492,
      "Setor": "Alimentos",
      "ID Produto": "1001"
    },
    {
      "Consumo m³/dia": 0.027583,
      "Setor": "Bebidas",
      "ID Produto": "1002"
    }
  ];
  
  // Teste 3: Estrutura com nomes de colunas em outro idioma
  const testData3 = [
    {
      "Product Code": "1001",
      "Department": "Food",
      "Daily Output": 0.025492
    },
    {
      "Product Code": "1002",
      "Department": "Beverages",
      "Daily Output": 0.027583
    }
  ];
  
  // Teste 4: Estrutura com muitas colunas extras
  const testData4 = [
    {
      "Col1": "Valor1",
      "Col2": "Valor2",
      "Código": "1001",
      "Col3": "Valor3",
      "Col4": "Valor4",
      "Departamento": "Alimentos",
      "Col5": "Valor5",
      "Col6": "Valor6",
      "Saída": 0.025492,
      "Col7": "Valor7"
    }
  ];
  
  // Mapeamentos para cada estrutura de teste
  const mapping1 = {
    productCode: "Código SKU",
    department: "Categoria",
    dailyCubicOutput: "Volume Diário (m³)"
  };
  
  const mapping2 = {
    productCode: "ID Produto",
    department: "Setor",
    dailyCubicOutput: "Consumo m³/dia"
  };
  
  const mapping3 = {
    productCode: "Product Code",
    department: "Department",
    dailyCubicOutput: "Daily Output"
  };
  
  const mapping4 = {
    productCode: "Código",
    department: "Departamento",
    dailyCubicOutput: "Saída"
  };
  
  // Parâmetros de picking para teste
  const pickingParameters = {
    'Módulo Inteiro - Cubagem (m³)': 1.72,
    'Módulo Inteiro - Freq. MÁX Abast (dias)': 3,
    'Meio Palete - Cubagem (m³)': 0.86,
    'Meio Palete - Freq. MÁX Abast (dias)': 12,
    '4P Aramado - Cubagem (m³)': 0.215,
    '4P Aramado - Freq. MÁX Abast (dias)': 18,
    '8P Aramado - Cubagem (m³)': 0.1075,
    '8P Aramado - Freq. MÁX Abast (dias)': 24
  };
  
  // Importar funções de cálculo
  const { processItems } = require('./pickingCalculator');
  
  // Executar testes
  console.log("=== Teste 1: Estrutura com nomes de colunas diferentes ===");
  const result1 = processItems(testData1, pickingParameters, {}, mapping1);
  console.log(result1);
  
  console.log("\n=== Teste 2: Estrutura com ordem de colunas diferente ===");
  const result2 = processItems(testData2, pickingParameters, {}, mapping2);
  console.log(result2);
  
  console.log("\n=== Teste 3: Estrutura com nomes de colunas em outro idioma ===");
  const result3 = processItems(testData3, pickingParameters, {}, mapping3);
  console.log(result3);
  
  console.log("\n=== Teste 4: Estrutura com muitas colunas extras ===");
  const result4 = processItems(testData4, pickingParameters, {}, mapping4);
  console.log(result4);
  
  // Verificar resultados
  console.log("\n=== Resumo dos Testes ===");
  console.log("Teste 1 - Tipo de picking calculado: " + result1[0]['Unnamed: 39']);
  console.log("Teste 2 - Tipo de picking calculado: " + result2[0]['Unnamed: 39']);
  console.log("Teste 3 - Tipo de picking calculado: " + result3[0]['Unnamed: 39']);
  console.log("Teste 4 - Tipo de picking calculado: " + result4[0]['Unnamed: 39']);
}

// Exportar função de teste
module.exports = { testColumnMapping };
