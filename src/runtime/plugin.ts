import { type $Fetch, FetchError } from 'ofetch'
import { createConsola, type ConsolaInstance } from 'consola'
import { createHttpClient } from './httpFactory'
import { useCodiexyUser } from './composables/useCodiexyUser'
import { useCodiexyConfig } from './composables/useCodiexyConfig'
import { useCodiexyAppConfig } from './composables/useCodiexyAppConfig'
import type { ModuleOptions } from './types/options'
import { IDENTITY_LOADED_KEY } from './utils/constants'
import { defineNuxtPlugin, updateAppConfig, useState, type NuxtApp } from '#app'

const LOGGER_NAME = 'codiexy-nuxt-auth'

function createCodiexyLogger(logLevel: number) {
  const envSuffix = import.meta.env.SSR ? 'ssr' : 'csr'
  const loggerName = LOGGER_NAME + ':' + envSuffix

  return createConsola({ level: logLevel }).withTag(loggerName)
}

async function setupDefaultTokenStorage(nuxtApp: NuxtApp, logger: ConsolaInstance) {
  logger.debug(
    'Token storage is not defined, switch to default cookie storage',
  )

  const defaultStorage = await import('./storages/cookieTokenStorage')

  nuxtApp.runWithContext(() => {
    updateAppConfig({
      codiexyAuth: {
        tokenStorage: defaultStorage.cookieTokenStorage,
      },
    })
  })
}

async function initialIdentityLoad(client: $Fetch, options: ModuleOptions, logger: ConsolaInstance) {
  const user = useCodiexyUser()

  const identityFetchedOnInit = useState<boolean>(
    IDENTITY_LOADED_KEY,
    () => false,
  )

  if (user.value === null && !identityFetchedOnInit.value) {
    identityFetchedOnInit.value = true

    logger.debug('Fetching user identity on plugin initialization')

    if (!options.endpoints.user) {
      throw new Error('`codiexyAuth.endpoints.user` is not defined')
    }

    try {
      user.value = await client(options.endpoints.user)
    }
    catch (error) {
      handleIdentityLoadError(error as Error, logger)
    }
  }
}

function handleIdentityLoadError(error: Error, logger: ConsolaInstance) {
  if (
    error instanceof FetchError
    && error.response
    && [401, 419].includes(error.response.status)
  ) {
    logger.debug(
      'User is not authenticated on plugin initialization, status:',
      error.response.status,
    )
  }
  else {
    logger.error('Unable to load user identity from API', error)
  }
}

export default defineNuxtPlugin({
  name: 'codiexy-nuxt-auth',
  async setup(_nuxtApp) {
    const nuxtApp = _nuxtApp as NuxtApp
    const options = useCodiexyConfig()
    const appConfig = useCodiexyAppConfig()
    const logger = createCodiexyLogger(options.logLevel)
    const client = createHttpClient(nuxtApp, logger)

    if (options.mode === 'token' && !appConfig.tokenStorage) {
      await setupDefaultTokenStorage(nuxtApp, logger)
    }

    if (options.client.initialRequest) {
      await initialIdentityLoad(client, options, logger)
    }

    return {
      provide: {
        codiexyClient: client,
      },
    }
  },
})
