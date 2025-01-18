import type { $Fetch } from 'ofetch'
import { useNuxtApp } from '#app'

export const useCodiexyClient = (): $Fetch => {
  const { $codiexyClient } = useNuxtApp()
  return $codiexyClient as $Fetch
}
