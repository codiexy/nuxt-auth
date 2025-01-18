import type { FetchContext } from 'ofetch'
import type { ConsolaInstance } from 'consola'
import type { TokenStorage } from '../../src/runtime/types/config'
import { defineAppConfig } from '#imports'
import type { NuxtApp } from '#app'

const tokenStorageKey = 'codiexy.storage.token'
const localTokenStorage: TokenStorage = {
  get: async () => {
    if (import.meta.server) {
      return undefined
    }

    return window.localStorage.getItem(tokenStorageKey) ?? undefined
  },

  set: async (app: NuxtApp, token?: string) => {
    if (import.meta.server) {
      return
    }

    if (!token) {
      window.localStorage.removeItem(tokenStorageKey)
      return
    }

    window.localStorage.setItem(tokenStorageKey, token)
  },
}

export default defineAppConfig({
  codiexyAuth: {
    interceptors: {
      onRequest: async (
        app: NuxtApp,
        ctx: FetchContext,
        logger: ConsolaInstance,
      ) => {
        logger.debug(`[onRequest] custom interceptor (${ctx.request})`)
      },

      onResponse: async (
        app: NuxtApp,
        ctx: FetchContext,
        logger: ConsolaInstance,
      ) => {
        logger.debug(`[onResponse] custom interceptor (${ctx.request})`)
      },
    },

    tokenStorage: localTokenStorage,
  },
})
