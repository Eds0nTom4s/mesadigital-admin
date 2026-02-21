<script setup>
/**
 * SkeletonLoader - Componente base para skeleton loading
 * 
 * Placeholder animado enquanto conteúdo carrega
 */

defineProps({
  width: {
    type: String,
    default: 'w-full'
  },
  height: {
    type: String,
    default: 'h-4'
  },
  rounded: {
    type: String,
    default: 'rounded'
  },
  animated: {
    type: Boolean,
    default: true
  }
})
</script>

<template>
  <div 
    :class="[
      'bg-gray-200',
      width,
      height,
      rounded,
      animated ? 'animate-pulse' : ''
    ]"
  ></div>
</template>
