const MB = 1024 * 1024

export const MAX_AVATAR_SIZE = 2 * MB
export const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export interface AvatarValidationResult {
  isValid: boolean
  errorMessage?: string
}

export const validateAvatarFile = (file: File): AvatarValidationResult => {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type as (typeof ALLOWED_AVATAR_TYPES)[number])) {
    return {
      isValid: false,
      errorMessage: 'Unsupported file format. Please upload JPG, PNG, or WEBP.'
    }
  }

  if (file.size > MAX_AVATAR_SIZE) {
    return {
      isValid: false,
      errorMessage: 'Image size must be 2MB or less.'
    }
  }

  return { isValid: true }
}

const readImageDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read selected image'))
    reader.readAsDataURL(file)
  })

const loadImageElement = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to decode selected image'))
    image.src = src
  })

export const cropAvatarToSquare = async (file: File): Promise<File> => {
  const dataUrl = await readImageDataUrl(file)
  const image = await loadImageElement(dataUrl)
  const edge = Math.min(image.width, image.height)
  const offsetX = (image.width - edge) / 2
  const offsetY = (image.height - edge) / 2

  const canvas = document.createElement('canvas')
  canvas.width = edge
  canvas.height = edge

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Failed to prepare image crop context')

  context.drawImage(image, offsetX, offsetY, edge, edge, 0, 0, edge, edge)

  const croppedBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to convert cropped image'))
          return
        }
        resolve(blob)
      },
      file.type,
      1
    )
  })

  return new File([croppedBlob], file.name, {
    type: file.type,
    lastModified: Date.now()
  })
}