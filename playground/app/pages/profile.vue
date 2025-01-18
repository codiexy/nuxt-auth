<script lang="ts" setup>
import { definePageMeta, useCodiexyAuth } from '#imports'

definePageMeta({
  middleware: ['codiexy:auth'],
})

const { isAuthenticated, user, refreshIdentity } = useCodiexyAuth()
</script>

<template>
  <p>Your authentication status - {{ isAuthenticated }}</p>
  <p>Identity object - {{ user }}</p>
  <div>
    <button @click="refreshIdentity">
      Refetch user
    </button>
  </div>
</template>
