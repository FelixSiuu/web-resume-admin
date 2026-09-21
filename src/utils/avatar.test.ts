import { describe, expect, it } from 'vitest'
import { MAX_AVATAR_SIZE, validateAvatarFile } from './avatar'

const createFile = (type: string, size: number, name = 'avatar-file') => {
  const content = 'a'.repeat(size)
  return new File([content], name, { type })
}

describe('validateAvatarFile', () => {
  it('rejects unsupported format', () => {
    const file = createFile('application/pdf', 1000, 'avatar.pdf')
    const result = validateAvatarFile(file)

    expect(result.isValid).toBe(false)
    expect(result.errorMessage).toMatch(/Unsupported file format/i)
  })

  it('rejects file larger than 2MB', () => {
    const file = createFile('image/png', MAX_AVATAR_SIZE + 1, 'avatar.png')
    const result = validateAvatarFile(file)

    expect(result.isValid).toBe(false)
    expect(result.errorMessage).toMatch(/2MB or less/i)
  })

  it('accepts valid file', () => {
    const file = createFile('image/jpeg', 1024, 'avatar.jpg')
    const result = validateAvatarFile(file)

    expect(result.isValid).toBe(true)
    expect(result.errorMessage).toBeUndefined()
  })
})