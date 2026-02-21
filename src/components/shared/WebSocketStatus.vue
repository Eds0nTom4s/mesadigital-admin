<template>
  <div 
    class="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm"
    :class="{
      'bg-success/10 text-success': status === 'conectado',
      'bg-warning/10 text-warning': status === 'reconectando',
      'bg-error/10 text-error': status === 'desconectado'
    }"
  >
    <!-- Ícone de status -->
    <div class="relative">
      <div 
        class="w-2 h-2 rounded-full"
        :class="{
          'bg-success': status === 'conectado',
          'bg-warning': status === 'reconectando',
          'bg-error': status === 'desconectado'
        }"
      ></div>
      <!-- Animação de pulso quando conectado -->
      <div 
        v-if="status === 'conectado'"
        class="absolute inset-0 w-2 h-2 rounded-full bg-success animate-ping"
      ></div>
    </div>

    <!-- Texto do status -->
    <span class="font-medium">
      {{ textoStatus }}
    </span>

    <!-- Botão de reconectar (quando desconectado) -->
    <button
      v-if="status === 'desconectado'"
      @click="$emit('reconectar')"
      class="ml-2 px-2 py-1 bg-error text-white rounded hover:opacity-80 transition-opacity text-xs"
    >
      Reconectar
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: (value) => ['conectado', 'reconectando', 'desconectado'].includes(value)
  }
})

defineEmits(['reconectar'])

const textoStatus = computed(() => {
  const textos = {
    conectado: 'Tempo Real Ativo',
    reconectando: 'Reconectando...',
    desconectado: 'Desconectado'
  }
  return textos[props.status] || 'Desconhecido'
})
</script>
