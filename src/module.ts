import {
  defineNuxtModule,
  addPlugin,
  createResolver,
  addImportsDir,
  addRouteMiddleware,
  useLogger,
} from '@nuxt/kit'
import { defu } from 'defu'
import { defaultModuleOptions } from './config'
import type { ModuleOptions } from './runtime/types/options'
import { registerTypeTemplates } from './templates'

const MODULE_NAME = 'codiexy-nuxt-auth'

export type ModulePublicRuntimeConfig = { codiexyAuth: ModuleOptions }

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: MODULE_NAME,
    configKey: 'codiexyAuth',
    compatibility: {
      nuxt: '>=3.12.0',
    },
  },

  defaults: defaultModuleOptions,

  setup(_options, _nuxt) {
    const resolver = createResolver(import.meta.url)
    const codiexyAuthConfig = defu(
      _nuxt.options.runtimeConfig.public.codiexyAuth,
      _options,
    )

    _nuxt.options.build.transpile.push(resolver.resolve('./runtime'))
    _nuxt.options.runtimeConfig.public.codiexyAuth = codiexyAuthConfig

    const logger = useLogger(MODULE_NAME, {
      level: codiexyAuthConfig.logLevel,
    })

    addPlugin(resolver.resolve('./runtime/plugin'), { append: codiexyAuthConfig.appendPlugin })
    addImportsDir(resolver.resolve('./runtime/composables'))

    if (codiexyAuthConfig.globalMiddleware.enabled) {
      addRouteMiddleware({
        name: 'codiexy:auth:global',
        path: resolver.resolve('./runtime/middleware/codiexy.global'),
        global: true,
      }, {
        prepend: codiexyAuthConfig.globalMiddleware.prepend,
      })

      logger.info('Codiexy Auth module initialized with global middleware')
    }
    else {
      addRouteMiddleware({
        name: 'codiexy:auth',
        path: resolver.resolve('./runtime/middleware/codiexy.auth'),
      })
      addRouteMiddleware({
        name: 'codiexy:guest',
        path: resolver.resolve('./runtime/middleware/codiexy.guest'),
      })

      logger.info('Codiexy Auth module initialized w/o global middleware')
    }

    registerTypeTemplates(resolver)
  },
})
