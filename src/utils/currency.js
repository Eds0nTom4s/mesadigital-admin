/**
 * Configurações de moeda e formatação
 * 
 * Centraliza todas as configurações relacionadas a moeda
 * para evitar hardcoding e facilitar internacionalização
 * 
 * IMPORTANTE: Backend armazena valores em CENTAVOS
 * 10000 centavos = 100,00 AOA
 */

export const CURRENCY_CONFIG = {
  code: 'AOA',
  symbol: 'Kz',
  name: 'Kwanza Angolano',
  locale: 'pt-AO',
  decimals: 2,
  symbolPosition: 'after', // 'before' ou 'after'
  centavos: true // Backend usa centavos
}

/**
 * Converte centavos para valor decimal
 * @param {number} centavos - Valor em centavos (ex: 10000)
 * @returns {number} Valor decimal (ex: 100.00)
 */
export const centavosParaDecimal = (centavos) => {
  if (centavos === null || centavos === undefined || isNaN(centavos)) {
    return 0
  }
  return centavos / 100
}

/**
 * Converte valor decimal para centavos
 * @param {number} decimal - Valor decimal (ex: 100.00)
 * @returns {number} Valor em centavos (ex: 10000)
 */
export const decimalParaCentavos = (decimal) => {
  if (decimal === null || decimal === undefined || isNaN(decimal)) {
    return 0
  }
  return Math.round(decimal * 100)
}

/**
 * Formata valor numérico para moeda
 * @param {number} value - Valor a ser formatado (em centavos se CURRENCY_CONFIG.centavos = true)
 * @param {boolean} showSymbol - Mostrar símbolo da moeda
 * @returns {string} Valor formatado
 */
export const formatCurrency = (value, showSymbol = true) => {
  if (value === null || value === undefined || isNaN(value)) {
    return showSymbol ? `0,00 ${CURRENCY_CONFIG.symbol}` : '0,00'
  }

  // Converte centavos para decimal se necessário
  const valorDecimal = CURRENCY_CONFIG.centavos ? centavosParaDecimal(value) : value

  const formatted = new Intl.NumberFormat(CURRENCY_CONFIG.locale, {
    minimumFractionDigits: CURRENCY_CONFIG.decimals,
    maximumFractionDigits: CURRENCY_CONFIG.decimals
  }).format(valorDecimal)

  if (!showSymbol) {
    return formatted
  }

  return CURRENCY_CONFIG.symbolPosition === 'before'
    ? `${CURRENCY_CONFIG.symbol} ${formatted}`
    : `${formatted} ${CURRENCY_CONFIG.symbol}`
}

/**
 * Parse string de moeda para número (retorna em centavos)
 * @param {string} currencyString - String formatada como moeda
 * @returns {number} Valor numérico em centavos
 */
export const parseCurrency = (currencyString) => {
  if (!currencyString) return 0
  
  // Remove símbolo, espaços e converte vírgula para ponto
  const cleaned = currencyString
    .replace(CURRENCY_CONFIG.symbol, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  
  const valorDecimal = parseFloat(cleaned) || 0
  
  // Retorna em centavos se configurado
  return CURRENCY_CONFIG.centavos ? decimalParaCentavos(valorDecimal) : valorDecimal
}

/**
 * Composable para uso em componentes Vue
 */
export const useCurrency = () => {
  return {
    formatCurrency,
    parseCurrency,
    centavosParaDecimal,
    decimalParaCentavos,
    currencyConfig: CURRENCY_CONFIG
  }
}
