import type { CodiexyAppConfig } from '../types/config'
import { useAppConfig } from '#app'

export const useCodiexyAppConfig = (): CodiexyAppConfig => {
  return (useAppConfig().codiexyAuth ?? {}) as CodiexyAppConfig
}
