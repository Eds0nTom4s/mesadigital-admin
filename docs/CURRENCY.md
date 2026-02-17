# Sistema de Moeda

## 📝 Visão Geral

O sistema de moeda foi implementado de forma **centralizada e configurável**, eliminando hardcoding e permitindo fácil internacionalização.

## 🎯 Moeda Padrão: AOA (Kwanza Angolano)

Toda a aplicação utiliza **Kwanza Angolano (AOA)** como moeda padrão.

## 🛠️ Arquitetura

### Arquivo de Configuração
**`src/utils/currency.js`**

Contém:
- Configuração centralizada da moeda
- Funções de formatação e parsing
- Composable para uso em componentes Vue

### Configuração Atual

```javascript
{
  code: 'AOA',           // Código ISO da moeda
  symbol: 'Kz',          // Símbolo exibido
  name: 'Kwanza Angolano',
  locale: 'pt-AO',       // Locale para formatação
  decimals: 2,           // Casas decimais
  symbolPosition: 'after' // Posição do símbolo
}
```

## 💻 Como Usar

### Em Componentes Vue

```vue
<script setup>
import { useCurrency } from '@/utils/currency'

const { formatCurrency, parseCurrency, currencyConfig } = useCurrency()

// Formatação
const preco = 1500
const precoFormatado = formatCurrency(preco) // "1.500,00 Kz"

// Parse
const valor = parseCurrency("1.500,00 Kz") // 1500
</script>

<template>
  <div>
    <p>Preço: {{ formatCurrency(1500) }}</p>
  </div>
</template>
```

### Funções Disponíveis

#### `formatCurrency(value, showSymbol = true)`
Formata número para moeda.

**Exemplos:**
```javascript
formatCurrency(1500)        // "1.500,00 Kz"
formatCurrency(1500, false) // "1.500,00"
formatCurrency(0.5)         // "0,50 Kz"
```

#### `parseCurrency(currencyString)`
Converte string formatada em número.

**Exemplos:**
```javascript
parseCurrency("1.500,00 Kz")  // 1500
parseCurrency("1.500,00")     // 1500
parseCurrency("500 Kz")       // 500
```

## ⚙️ Configuração via Variáveis de Ambiente

É possível sobrescrever configurações via `.env`:

```bash
VITE_CURRENCY_CODE=AOA
VITE_CURRENCY_SYMBOL=Kz
VITE_CURRENCY_LOCALE=pt-AO
```

Para usar essas variáveis, atualize `src/utils/currency.js`:

```javascript
export const CURRENCY_CONFIG = {
  code: import.meta.env.VITE_CURRENCY_CODE || 'AOA',
  symbol: import.meta.env.VITE_CURRENCY_SYMBOL || 'Kz',
  locale: import.meta.env.VITE_CURRENCY_LOCALE || 'pt-AO',
  // ...
}
```

## 🔄 Mudando a Moeda

Para alterar a moeda do sistema:

1. Edite `src/utils/currency.js`:
```javascript
export const CURRENCY_CONFIG = {
  code: 'USD',
  symbol: '$',
  locale: 'en-US',
  symbolPosition: 'before'
}
```

2. Reinicie o servidor de desenvolvimento

**Não é necessário alterar nenhum componente!**

## 📋 Componentes Atualizados

Todos os módulos foram refatorados:
- ✅ Dashboard
- ✅ Pedidos
- ✅ Produtos
- ✅ Mesas
- ✅ Fundos
- ✅ Usuários
- ✅ Auditoria

## 🌍 Internacionalização (Futuro)

Para suportar múltiplas moedas:

```javascript
// src/utils/currencies.js
export const CURRENCIES = {
  AOA: {
    code: 'AOA',
    symbol: 'Kz',
    locale: 'pt-AO'
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    locale: 'pt-PT'
  },
  USD: {
    code: 'USD',
    symbol: '$',
    locale: 'en-US'
  }
}

// Store
const currencyStore = useCurrencyStore()
currencyStore.setActiveCurrency('AOA')
```

## ✨ Benefícios da Abordagem

1. **Sem Hardcoding**: Nenhum símbolo de moeda hardcoded nos componentes
2. **Centralizado**: Uma única fonte de configuração
3. **Reutilizável**: Composable disponível em qualquer componente
4. **Consistente**: Formatação uniforme em toda aplicação
5. **Flexível**: Fácil mudança de moeda
6. **Preparado para i18n**: Base sólida para internacionalização

## 🔍 Exemplos de Uso nos Módulos

### Dashboard
```vue
<p class="text-3xl font-bold">{{ formatCurrency(1247) }}</p>
<!-- Exibe: 1.247,00 Kz -->
```

### Produtos
```vue
<span class="text-xl font-bold text-primary">
  {{ formatCurrency(2.50) }}
</span>
<!-- Exibe: 2,50 Kz -->
```

### Fundos
```vue
<td>{{ formatCurrency(200.00) }}</td>
<td class="text-error">-{{ formatCurrency(45.80) }}</td>
<!-- Exibe: 200,00 Kz e -45,80 Kz -->
```

## 📚 Referências

- [Intl.NumberFormat - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
- [ISO 4217 - Currency Codes](https://www.iso.org/iso-4217-currency-codes.html)
- Locale pt-AO: Português de Angola
