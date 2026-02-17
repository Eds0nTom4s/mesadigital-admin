/**
 * Configurações de moeda e formatação
 * 
 * Centraliza todas as configurações relacionadas a moeda
 * para evitar hardcoding e facilitar internacionalização
 */

export const CURRENCY_CONFIG = {
  code: 'AOA',
  symbol: 'Kz',
  name: 'Kwanza Angolano',
  locale: 'pt-AO',
  decimals: 2,
  symbolPosition: 'after' // 'before' ou 'after'
}

/**
 * Formata valor numérico para moeda
 * @param {number} value - Valor a ser formatado
 * @param {boolean} showSymbol - Mostrar símbolo da moeda
 * @returns {string} Valor formatado
 */
export const formatCurrency = (value, showSymbol = true) => {
  if (value === null || value === undefined || isNaN(value)) {
    return showSymbol ? `0,00 ${CURRENCY_CONFIG.symbol}` : '0,00'
  }

  const formatted = new Intl.NumberFormat(CURRENCY_CONFIG.locale, {
    minimumFractionDigits: CURRENCY_CONFIG.decimals,
    maximumFractionDigits: CURRENCY_CONFIG.decimals
  }).format(value)

  if (!showSymbol) {
    return formatted
  }

  return CURRENCY_CONFIG.symbolPosition === 'before'
    ? `${CURRENCY_CONFIG.symbol} ${formatted}`
    : `${formatted} ${CURRENCY_CONFIG.symbol}`
}

/**
 * Parse string de moeda para número
 * @param {string} currencyString - String formatada como moeda
 * @returns {number} Valor numérico
 */
export const parseCurrency = (currencyString) => {
  if (!currencyString) return 0
  
  // Remove símbolo, espaços e converte vírgula para ponto
  const cleaned = currencyString
    .replace(CURRENCY_CONFIG.symbol, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  
  return parseFloat(cleaned) || 0
}

/**
 * Composable para uso em componentes Vue
 */
export const useCurrency = () => {
  return {
    formatCurrency,
    parseCurrency,
    currencyConfig: CURRENCY_CONFIG
  }
}
