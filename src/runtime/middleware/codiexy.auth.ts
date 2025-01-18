import type { RouteLocationAsPathGeneric } from 'vue-router'
import { useCodiexyConfig } from '../composables/useCodiexyConfig'
import { useCodiexyAuth } from '../composables/useCodiexyAuth'
import { trimTrailingSlash } from '../utils/formatter'
import { defineNuxtRouteMiddleware, navigateTo, createError } from '#app'

export default defineNuxtRouteMiddleware((to) => {
  const options = useCodiexyConfig()
  const { isAuthenticated } = useCodiexyAuth()

  if (isAuthenticated.value) {
    return
  }

  const endpoint = options.redirect.onAuthOnly

  if (endpoint === undefined) {
    throw new Error('`codiexyAuth.redirect.onAuthOnly` is not defined')
  }

  if (endpoint === false) {
    throw createError({ statusCode: 403 })
  }

  const redirect: RouteLocationAsPathGeneric = { path: endpoint }

  if (options.redirect.keepRequestedRoute) {
    redirect.query = { redirect: trimTrailingSlash(to.fullPath) }
  }

  return navigateTo(redirect, { replace: true })
})
