<script lang="ts" setup>
import { definePageMeta } from '#imports'

definePageMeta({
  middleware: ['codiexy:guest'],
})
</script>

<template>
  <p>Thanks for checking out this demo app! See you later :)</p>
</template>
