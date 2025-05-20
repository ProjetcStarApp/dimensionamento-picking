// Lógica de cálculo para dimensionamento de picking com suporte a mapeamento de colunas
// Baseado nas fórmulas da coluna AN da aba Base

// Interface para o mapeamento de colunas
interface ColumnMapping {
  productCode: string;
  department: string;
  dailyCubicOutput: string;
}

function calculatePickingType(item: any, parameters: any, columnMapping?: ColumnMapping) {
  // Extrair valores relevantes do item usando mapeamento de colunas se disponível
  let saidaCubicaDia = 0;
  
  if (columnMapping) {
    // Usar coluna mapeada para saída cúbica/dia
    saidaCubicaDia = parseFloat(item[columnMapping.dailyCubicOutput]) || 0;
  } else {
    // Fallback para coluna padrão (AM - Saida cubica/dia)
    saidaCubicaDia = item['Unnamed: 38'] || 0;
  }
  
  // Extrair parâmetros de picking
  const meioModuloCubagem = parameters['Módulo Inteiro - Cubagem (m³)'] || 1.72;
  const meioPaleteCubagem = parameters['Meio Palete - Cubagem (m³)'] || 0.86;
  const aramado4pCubagem = parameters['4P Aramado - Cubagem (m³)'] || 0.215;
  const aramado8pCubagem = parameters['8P Aramado - Cubagem (m³)'] || 0.1075;
  
  const meioModuloFreq = parameters['Módulo Inteiro - Freq. MÁX Abast (dias)'] || 3;
  const meioPaleteFreq = parameters['Meio Palete - Freq. MÁX Abast (dias)'] || 12;
  const aramado4pFreq = parameters['4P Aramado - Freq. MÁX Abast (dias)'] || 18;
  const aramado8pFreq = parameters['8P Aramado - Freq. MÁX Abast (dias)'] || 24;
  
  // Calcular consumo máximo para cada tipo de picking
  const meioModuloConsumoMax = meioModuloCubagem / meioModuloFreq;
  const meioPaleteConsumoMax = meioPaleteCubagem / meioPaleteFreq;
  const aramado4pConsumoMax = aramado4pCubagem / aramado4pFreq;
  const aramado8pConsumoMax = aramado8pCubagem / aramado8pFreq;
  
  // Lógica de decisão baseada no consumo diário
  if (saidaCubicaDia > meioModuloConsumoMax) {
    return 'Modulo inteiro';
  } else if (saidaCubicaDia > meioPaleteConsumoMax) {
    return 'Meio palete';
  } else if (saidaCubicaDia > aramado4pConsumoMax) {
    return '4P - Aramado';
  } else if (saidaCubicaDia > aramado8pConsumoMax) {
    return '8P - Aramado';
  } else {
    return 'Duplo';
  }
}

// Função para processar todos os itens
function processItems(items: any[], pickingParameters: any, dimensionParameters: any, columnMapping?: ColumnMapping) {
  return items.map(item => {
    const pickingType = calculatePickingType(item, pickingParameters, columnMapping);
    
    // Extrair informações de produto e departamento usando mapeamento
    let productCode = '';
    let department = '';
    
    if (columnMapping) {
      productCode = item[columnMapping.productCode] || '';
      department = item[columnMapping.department] || '';
    }
    
    // Criar uma cópia do item com o tipo de picking calculado
    return {
      ...item,
      'Unnamed: 39': pickingType, // Coluna AN - Novo Picking
      '_calculated': true, // Marcador para itens processados
      '_mappedProductCode': productCode,
      '_mappedDepartment': department,
      '_columnMapping': columnMapping
    };
  });
}

export { calculatePickingType, processItems };
