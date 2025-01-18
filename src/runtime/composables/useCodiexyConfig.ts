import type { ModuleOptions } from '../types/options'
import { useRuntimeConfig } from '#app'

export const useCodiexyConfig = (): ModuleOptions => {
  return useRuntimeConfig().public.codiexyAuth as ModuleOptions
}
