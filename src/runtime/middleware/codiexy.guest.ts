import { useCodiexyAuth } from '../composables/useCodiexyAuth'
import { useCodiexyConfig } from '../composables/useCodiexyConfig'
import { defineNuxtRouteMiddleware, navigateTo, createError } from '#app'

export default defineNuxtRouteMiddleware(() => {
  const options = useCodiexyConfig()
  const { isAuthenticated } = useCodiexyAuth()

  if (!isAuthenticated.value) {
    return
  }

  const endpoint = options.redirect.onGuestOnly

  if (endpoint === undefined) {
    throw new Error('`codiexyAuth.redirect.onGuestOnly` is not defined')
  }

  if (endpoint === false) {
    throw createError({ statusCode: 403 })
  }

  return navigateTo(endpoint, { replace: true })
})
