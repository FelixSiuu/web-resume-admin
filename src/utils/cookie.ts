/** Read a non-HttpOnly cookie visible to the current document origin. */
export const getCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined

  const encodedName = encodeURIComponent(name)
  const parts = document.cookie.split('; ')

  for (const part of parts) {
    const separatorIndex = part.indexOf('=')
    if (separatorIndex === -1) continue

    const key = part.slice(0, separatorIndex)
    if (key !== encodedName && key !== name) continue

    return decodeURIComponent(part.slice(separatorIndex + 1))
  }

  return undefined
}
