/** Resolve um arquivo de `public/` contra o `base` do Vite, para funcionar em qualquer pasta publicada. */
export function asset(path: string): string {
  return import.meta.env.BASE_URL + path.replace(/^\/+/, '')
}
