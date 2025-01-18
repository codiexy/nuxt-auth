import type { Ref } from 'vue'
import { useCodiexyConfig } from './useCodiexyConfig'
import { useState } from '#app'

/**
 * Returns a current authenticated user information.
 * @returns Reference to the user state as T.
 */
export const useCodiexyUser = <T>(): Ref<T | null> => {
  const options = useCodiexyConfig()
  return useState<T | null>(options.userStateKey, () => null)
}
