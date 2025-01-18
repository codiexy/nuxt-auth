<script lang="ts" setup>
import { useCodiexyAuth } from '#imports'

const { isAuthenticated, logout } = useCodiexyAuth()
</script>

<template>
  <NuxtLoadingIndicator />

  <h1>Nuxt - Codiexy Auth application sample</h1>

  <nav class="menu">
    <NuxtLink to="/">
      Home
    </NuxtLink>
    <NuxtLink to="/login">
      Login
    </NuxtLink>
    <NuxtLink to="/logout">
      Logout
    </NuxtLink>
    <NuxtLink to="/profile">
      Profile
    </NuxtLink>
    <NuxtLink to="/welcome">
      Welcome
    </NuxtLink>

    <button
      v-if="isAuthenticated"
      @click="logout"
    >
      Logout
    </button>
  </nav>

  <hr>
  <slot />
</template>

<style scoped>
.menu {
    display: flex;
    gap: 1rem;
}
</style>
