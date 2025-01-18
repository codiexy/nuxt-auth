import { type Ref, computed } from 'vue'
import { trimTrailingSlash } from '../utils/formatter'
import { IDENTITY_LOADED_KEY } from '../utils/constants'
import { useCodiexyClient } from './useCodiexyClient'
import { useCodiexyUser } from './useCodiexyUser'
import { useCodiexyConfig } from './useCodiexyConfig'
import { useCodiexyAppConfig } from './useCodiexyAppConfig'
import { navigateTo, useNuxtApp, useRoute, useState } from '#app'

export interface CodiexyAuth<T> {
  user: Ref<T | null>
  isAuthenticated: Ref<boolean>
  init: () => Promise<void>
  login: (credentials: Record<string, any>) => Promise<void>
  logout: () => Promise<void>
  refreshIdentity: () => Promise<void>
}

export type TokenResponse = {
  token?: string
}

/**
 * Provides authentication methods for Codiexy Auth
 *
 * @template T Type of the user object
 */
export const useCodiexyAuth = <T>(): CodiexyAuth<T> => {
  const nuxtApp = useNuxtApp()

  const user = useCodiexyUser<T>()
  const client = useCodiexyClient()
  const options = useCodiexyConfig()
  const appConfig = useCodiexyAppConfig()

  const isAuthenticated = computed(() => {
    return user.value !== null
  })

  const isIdentityLoaded = useState<boolean>(
    IDENTITY_LOADED_KEY,
    () => false,
  )

  /**
   * Initial request of the user identity for plugin initialization.
   * Only call this method when `codiexyAuth.client.initialRequest` is false.
   */
  async function init() {
    if (isIdentityLoaded.value) {
      return
    }

    isIdentityLoaded.value = true
    await refreshIdentity()
  }

  /**
   * Fetches the user object from the API and sets it to the current state
   */
  async function refreshIdentity() {
    user.value = await client<T>(options.endpoints.user!)
  }

  /**
   * Calls the login endpoint and sets the user object to the current state
   *
   * @param credentials Credentials to pass to the login endpoint
   */
  async function login(credentials: Record<string, any>) {
    const currentRoute = useRoute()
    const currentPath = trimTrailingSlash(currentRoute.path)

    if (isAuthenticated.value) {
      if (!options.redirectIfAuthenticated) {
        throw new Error('User is already authenticated')
      }

      if (
        options.redirect.onLogin === false
        || options.redirect.onLogin === currentPath
      ) {
        return
      }

      if (options.redirect.onLogin === undefined) {
        throw new Error('`codiexyAuth.redirect.onLogin` is not defined')
      }

      await nuxtApp.runWithContext(
        async () => await navigateTo(options.redirect.onLogin as string),
      )
    }

    if (options.endpoints.login === undefined) {
      throw new Error('`codiexyAuth.endpoints.login` is not defined')
    }

    const response = await client<TokenResponse>(options.endpoints.login, {
      method: 'post',
      body: credentials,
    })

    if (options.mode === 'token') {
      if (appConfig.tokenStorage === undefined) {
        throw new Error('`codiexyAuth.tokenStorage` is not defined in app.config.ts')
      }

      if (response.token === undefined) {
        throw new Error('Token was not returned from the API')
      }

      await appConfig.tokenStorage.set(nuxtApp, response.token)
    }

    await refreshIdentity()

    if (options.redirect.keepRequestedRoute) {
      const requestedRoute = currentRoute.query.redirect as string | undefined

      if (requestedRoute && requestedRoute !== currentPath) {
        await nuxtApp.runWithContext(async () => await navigateTo(requestedRoute))
        return
      }
    }

    if (
      options.redirect.onLogin === false
      || currentRoute.path === options.redirect.onLogin
    ) {
      return
    }

    if (options.redirect.onLogin === undefined) {
      throw new Error('`codiexyAuth.redirect.onLogin` is not defined')
    }

    await nuxtApp.runWithContext(
      async () => await navigateTo(options.redirect.onLogin as string),
    )
  }

  /**
   * Calls the logout endpoint and clears the user object
   */
  async function logout() {
    if (!isAuthenticated.value) {
      throw new Error('User is not authenticated')
    }

    const currentRoute = useRoute()
    const currentPath = trimTrailingSlash(currentRoute.path)

    if (options.endpoints.logout === undefined) {
      throw new Error('`codiexyAuth.endpoints.logout` is not defined')
    }

    await client(options.endpoints.logout, { method: 'post' })

    user.value = null

    if (options.mode === 'token') {
      if (appConfig.tokenStorage === undefined) {
        throw new Error('`codiexyAuth.tokenStorage` is not defined in app.config.ts')
      }

      await appConfig.tokenStorage.set(nuxtApp, undefined)
    }

    if (
      options.redirect.onLogout === false
      || currentPath === options.redirect.onLogout
    ) {
      return
    }

    if (options.redirect.onLogout === undefined) {
      throw new Error('`codiexyAuth.redirect.onLogout` is not defined')
    }

    await nuxtApp.runWithContext(
      async () => await navigateTo(options.redirect.onLogout as string),
    )
  }

  return {
    user,
    isAuthenticated,
    init,
    login,
    logout,
    refreshIdentity,
  } as CodiexyAuth<T>
}
