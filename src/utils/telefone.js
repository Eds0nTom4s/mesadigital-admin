export function normalizarTelefoneAngola(valor) {
  if (!valor || !String(valor).trim()) {
    throw new Error('Informe o número de telemóvel')
  }

  let digits = String(valor).replace(/\D/g, '')

  if (digits.startsWith('244')) {
    digits = digits.slice(3)
  }

  if (digits.startsWith('0')) {
    digits = digits.slice(1)
  }

  if (digits.length !== 9) {
    throw new Error('O número deve ter 9 dígitos')
  }

  return `+244${digits}`
}

export function limitarTelefoneLocal(valor) {
  let digits = String(valor || '').replace(/\D/g, '')

  if (digits.startsWith('244')) {
    digits = digits.slice(3)
  }

  if (digits.startsWith('0')) {
    digits = digits.slice(1)
  }

  return digits.slice(0, 9)
}
