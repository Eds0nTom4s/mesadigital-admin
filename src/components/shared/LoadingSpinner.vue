<script setup>
/**
 * LoadingSpinner - Componente de loading personalizado
 * 
 * Exibe logo circular com animação neon de borda
 * Cores sincronizadas com o sistema (primary/accent)
 */

defineProps({
  tamanho: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg', 'xl'].includes(value)
  },
  mensagem: {
    type: String,
    default: ''
  }
})

const tamanhos = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-32 h-32',
  xl: 'w-48 h-48'
}
</script>

<template>
  <div class="flex flex-col items-center justify-center">
    <!-- Logo com animação de borda neon -->
    <div :class="['relative', tamanhos[tamanho]]">
      <!-- Borda animada com efeito neon -->
      <div class="absolute inset-0 rounded-full animate-spin-slow">
        <div class="w-full h-full rounded-full border-4 border-transparent border-t-primary border-r-accent shadow-neon"></div>
      </div>
      
      <!-- Segunda camada de borda (contra-rotação) -->
      <div class="absolute inset-0 rounded-full animate-spin-reverse">
        <div class="w-full h-full rounded-full border-4 border-transparent border-b-primary border-l-accent opacity-60"></div>
      </div>
      
      <!-- Logo central -->
      <div class="absolute inset-2 rounded-full bg-card flex items-center justify-center overflow-hidden shadow-inner">
        <img 
          src="/logo/Logo Maspe.png" 
          alt="Mesa Digital" 
          class="w-full h-full object-contain p-2 animate-pulse-soft"
        />
      </div>
    </div>
    
    <!-- Mensagem opcional -->
    <p v-if="mensagem" class="mt-4 text-text-secondary text-sm font-medium animate-pulse">
      {{ mensagem }}
    </p>
  </div>
</template>

<style scoped>
/* Animação de rotação lenta */
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Animação de rotação reversa */
@keyframes spin-reverse {
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
}

/* Pulse suave para o logo */
@keyframes pulse-soft {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.85;
    transform: scale(0.98);
  }
}

.animate-spin-slow {
  animation: spin-slow 2s linear infinite;
}

.animate-spin-reverse {
  animation: spin-reverse 3s linear infinite;
}

.animate-pulse-soft {
  animation: pulse-soft 2s ease-in-out infinite;
}

/* Efeito de sombra neon usando cores do sistema */
.shadow-neon {
  box-shadow: 
    0 0 10px rgba(var(--color-primary-rgb), 0.5),
    0 0 20px rgba(var(--color-primary-rgb), 0.3),
    0 0 30px rgba(var(--color-accent-rgb), 0.2);
}

/* Fallback caso as variáveis CSS não existam */
:root {
  --color-primary-rgb: 79, 70, 229;
  --color-accent-rgb: 16, 185, 129;
}
</style>
