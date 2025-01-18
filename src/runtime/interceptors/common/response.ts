import type { FetchContext } from 'ofetch'
import type { ConsolaInstance } from 'consola'
import type { ModuleOptions } from '../../types/options'
import { type NuxtApp, useRequestURL } from '#app'

type HeaderValidator = (headers: Headers, config: ModuleOptions, logger: ConsolaInstance) => void

const validateCookieHeader: HeaderValidator = (
  headers: Headers,
  config: ModuleOptions,
  logger: ConsolaInstance,
): void => {
  if (config.mode == 'token') {
    return
  }

  if (!headers.has('set-cookie')) {
    logger.warn('[response] `set-cookie` header is missing')
  }
}

const validateContentTypeHeader: HeaderValidator = (
  headers: Headers,
  config: ModuleOptions,
  logger: ConsolaInstance,
): void => {
  const contentType = headers.get('content-type')

  if (!contentType || !contentType.includes('application/json')) {
    logger.warn('[response] `content-type` header is missing or invalid')
  }
}

const validateCredentialsHeader: HeaderValidator = (
  headers: Headers,
  config: ModuleOptions,
  logger: ConsolaInstance,
): void => {
  if (config.mode == 'token') {
    return
  }

  const allowCredentials = headers.get('access-control-allow-credentials')

  if (!allowCredentials || allowCredentials !== 'true') {
    logger.warn('[response] `access-control-allow-credentials` header is missing or invalid')
  }
}

const validateOriginHeader: HeaderValidator = (
  headers: Headers,
  config: ModuleOptions,
  logger: ConsolaInstance,
): void => {
  const allowOrigin = headers.get('access-control-allow-origin')
  const currentOrigin = config?.origin ?? useRequestURL().origin

  if (!allowOrigin || !allowOrigin.includes(currentOrigin)) {
    logger.warn('[response] `access-control-allow-origin` header is missing or invalid')
  }
}

const validators: HeaderValidator[] = [
  validateCookieHeader,
  validateContentTypeHeader,
  validateCredentialsHeader,
  validateOriginHeader,
]

export default async function validateResponseHeaders(
  app: NuxtApp,
  ctx: FetchContext,
  logger: ConsolaInstance,
): Promise<void> {
  if (import.meta.client) {
    logger.debug('[response] skipping headers validation on CSR')
    return
  }

  const config = app.$config.public.codiexyAuth as ModuleOptions
  const headers = ctx.response?.headers

  if (!headers) {
    logger.warn('[response] no headers returned from API')
    return
  }

  for (const validator of validators) {
    validator(headers, config, logger)
  }
}
