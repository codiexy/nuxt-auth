<script lang="ts" setup>
import { definePageMeta } from '#imports'

definePageMeta({
  middleware: ['codiexy:auth'],
})
</script>

<template>
  <p>Welcome, now you can access pages you had no access before... Try it!</p>
</template>
