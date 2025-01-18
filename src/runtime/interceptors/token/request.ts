import type { FetchContext } from 'ofetch'
import type { ConsolaInstance } from 'consola'
import { useCodiexyAppConfig } from '../../composables/useCodiexyAppConfig'
import { appendRequestHeaders } from '../../utils/headers'
import type { NuxtApp } from '#app'

/**
 * Use token in authentication header for the request
 * @param app Nuxt application instance
 * @param ctx Fetch context
 * @param logger Module logger instance
 */
export default async function handleRequestTokenHeader(
  app: NuxtApp,
  ctx: FetchContext,
  logger: ConsolaInstance,
): Promise<void> {
  const appConfig = useCodiexyAppConfig()

  if (appConfig.tokenStorage === undefined) {
    throw new Error('`codiexyAuth.tokenStorage` is not defined in app.config.ts')
  }

  const token = await appConfig.tokenStorage.get(app)

  if (!token) {
    logger.debug('[request] authentication token is not set in the storage')
    return
  }

  const headersToAdd = { Authorization: `Bearer ${token}` }

  logger.debug(
    '[request] add authentication token header',
    Object.keys(headersToAdd),
  )

  ctx.options.headers = appendRequestHeaders(ctx.options.headers, headersToAdd)
}
