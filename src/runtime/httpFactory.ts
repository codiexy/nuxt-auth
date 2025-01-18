import type { $Fetch, FetchContext, FetchOptions } from 'ofetch'
import type { ConsolaInstance } from 'consola'
import { useCodiexyUser } from './composables/useCodiexyUser'
import { useCodiexyConfig } from './composables/useCodiexyConfig'
import { useCodiexyAppConfig } from './composables/useCodiexyAppConfig'
import handleRequestCookies from './interceptors/cookie/request'
import handleResponseHeaders from './interceptors/cookie/response'
import handleRequestHeaders from './interceptors/common/request'
import handleRequestTokenHeader from './interceptors/token/request'
import validateResponseHeaders from './interceptors/common/response'
import type { CodiexyAppConfig, CodiexyInterceptor } from './types/config'
import type { ModuleOptions } from './types/options'
import { navigateTo, type NuxtApp } from '#app'

function useClientInterceptors(
  options: ModuleOptions,
  appConfig: CodiexyAppConfig,
): [CodiexyInterceptor[], CodiexyInterceptor[]] {
  const [request, response] = [
    [] as CodiexyInterceptor[],
    [] as CodiexyInterceptor[],
  ]

  request.push(handleRequestHeaders)

  if (options.mode === 'cookie') {
    request.push(handleRequestCookies)
    response.push(handleResponseHeaders)
  }

  if (options.mode === 'token') {
    request.push(handleRequestTokenHeader)
  }

  response.push(validateResponseHeaders)

  if (appConfig.interceptors?.onRequest) {
    request.push(appConfig.interceptors.onRequest)
  }

  if (appConfig.interceptors?.onResponse) {
    response.push(appConfig.interceptors.onResponse)
  }

  return [request, response]
}

function determineCredentialsMode() {
  // Fix for Cloudflare workers - https://github.com/cloudflare/workers-sdk/issues/2514
  const isCredentialsSupported = 'credentials' in Request.prototype

  if (!isCredentialsSupported) {
    return undefined
  }

  return 'include'
}

export function createHttpClient(nuxtApp: NuxtApp, logger: ConsolaInstance): $Fetch {
  const options = useCodiexyConfig()
  const user = useCodiexyUser()
  const appConfig = useCodiexyAppConfig()

  const [
    requestInterceptors,
    responseInterceptors,
  ] = useClientInterceptors(options, appConfig)

  const httpOptions: FetchOptions = {
    baseURL: options.baseUrl,
    credentials: determineCredentialsMode(),
    redirect: 'manual',
    retry: options.client.retry === true ? 1 : options.client.retry, // false or number

    async onRequest(context: FetchContext): Promise<void> {
      for (const interceptor of requestInterceptors) {
        await nuxtApp.runWithContext(async () => {
          await interceptor(nuxtApp, context, logger)
        })
      }

      logger.trace(
        `Request headers for "${context.request.toString()}"`,
        context.options.headers instanceof Headers
          ? Object.fromEntries(context.options.headers.entries())
          : context.options.headers,
      )
    },

    async onResponse(context: FetchContext): Promise<void> {
      for (const interceptor of responseInterceptors) {
        await nuxtApp.runWithContext(async () => {
          await interceptor(nuxtApp, context, logger)
        })
      }

      logger.trace(
        `Response headers for "${context.request.toString()}"`,
        context.response ? Object.fromEntries(context.response.headers.entries()) : {},
      )
    },

    async onResponseError({ response }): Promise<void> {
      if (response.status === 419) {
        logger.warn('CSRF token mismatch, check your API configuration')
        return
      }

      if (response.status === 401) {
        if (user.value !== null) {
          logger.warn('User session is not set in API or expired, resetting identity')
          user.value = null
        }

        if (
          import.meta.client
            && options.redirectIfUnauthenticated
            && options.redirect.onAuthOnly
        ) {
          await nuxtApp.runWithContext(
            async () =>
              await navigateTo(
                options.redirect.onAuthOnly as string,
              ),
          )
        }
      }
    },
  }

  return $fetch.create(httpOptions) as $Fetch
}
