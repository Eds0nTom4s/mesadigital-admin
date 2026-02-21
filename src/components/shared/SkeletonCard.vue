<script setup>
import SkeletonLoader from './SkeletonLoader.vue'

/**
 * SkeletonCard - Card skeleton para listagens
 */
</script>

<template>
  <div class="card">
    <!-- Header -->
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center space-x-3 flex-1">
        <SkeletonLoader width="w-10" height="h-10" rounded="rounded-lg" />
        <div class="flex-1 space-y-2">
          <SkeletonLoader width="w-3/4" height="h-4" />
          <SkeletonLoader width="w-1/2" height="h-3" />
        </div>
      </div>
      <SkeletonLoader width="w-16" height="h-6" rounded="rounded-full" />
    </div>

    <!-- Body -->
    <div class="space-y-3">
      <div class="flex items-center justify-between p-3 bg-background rounded-lg">
        <SkeletonLoader width="w-20" height="h-3" />
        <SkeletonLoader width="w-24" height="h-6" />
      </div>
      <div class="flex items-center justify-between">
        <SkeletonLoader width="w-24" height="h-3" />
        <SkeletonLoader width="w-32" height="h-3" />
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-4 pt-4 border-t border-border">
      <SkeletonLoader width="w-full" height="h-10" rounded="rounded-lg" />
    </div>
  </div>
</template>
