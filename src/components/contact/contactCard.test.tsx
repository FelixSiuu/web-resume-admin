import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ContactCard from './contactCard'
import { MAX_AVATAR_SIZE } from '@/utils/avatar'

vi.mock('@/utils/avatar', async () => {
  const actual = await vi.importActual<typeof import('@/utils/avatar')>('@/utils/avatar')
  return {
    ...actual,
    cropAvatarToSquare: vi.fn(async (file: File) => file)
  }
})

const updateContactMock = vi.fn()
const uploadAvatarMock = vi.fn()
const removeAvatarMock = vi.fn()
const refetchAvatarMock = vi.fn()
let mockData: Contact | undefined
let mockAvatarPreview: string | null

vi.mock('@/hooks/useContactHooks', () => ({
  default: () => ({
    data: mockData,
    isLoading: false,
    updateContact: updateContactMock,
    isUpdateLoading: false
  })
}))

vi.mock('@/hooks/useAvatarHooks', () => ({
  default: () => ({
    avatarPreview: mockAvatarPreview,
    isAvatarLoading: false,
    uploadAvatar: uploadAvatarMock,
    isUploadingAvatar: false,
    removeAvatar: removeAvatarMock,
    isRemovingAvatar: false,
    refetchAvatar: refetchAvatarMock
  })
}))

describe('ContactCard', () => {
  beforeEach(() => {
    mockData = undefined
    mockAvatarPreview = null
    updateContactMock.mockClear()
    uploadAvatarMock.mockClear()
    removeAvatarMock.mockClear()
    refetchAvatarMock.mockClear()
  })

  it('submits normalized contact payload', async () => {
    render(<ContactCard />)

    fireEvent.change(screen.getByLabelText('Display Name'), {
      target: { value: '  Felix Siu  ' }
    })
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: '  Frontend Engineer ' }
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'felix@example.com' }
    })
    fireEvent.change(screen.getByLabelText('Phone'), {
      target: { value: '  ' }
    })
    fireEvent.change(screen.getByLabelText('Address'), {
      target: { value: '  Kowloon  ' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save Contact' }))

    await waitFor(() => {
      expect(updateContactMock).toHaveBeenCalledTimes(1)
    })

    expect(updateContactMock).toHaveBeenCalledWith({
      displayName: 'Felix Siu',
      title: 'Frontend Engineer',
      email: 'felix@example.com',
      phone: null,
      address: 'Kowloon',
      socialLinks: null,
      publicMap: {
        displayName: false,
        title: false,
        email: false,
        phone: false,
        address: false
      }
    })
  })

  it('shows fetched contact values in form', async () => {
    mockData = {
      displayName: 'Felix',
      title: 'Engineer',
      email: 'felix@example.com',
      phone: '12345678',
      address: 'Hong Kong',
      socialLinks: null,
      publicMap: null,
      createTime: null,
      updateTime: null
    }

    render(<ContactCard />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Felix')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Engineer')).toBeInTheDocument()
      expect(screen.getByDisplayValue('felix@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('12345678')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Hong Kong')).toBeInTheDocument()
    })
  })

  it('shows remove avatar button when avatar preview exists', () => {
    mockAvatarPreview = 'data:image/png;base64,mock'

    render(<ContactCard />)

    expect(screen.getByAltText('Avatar preview')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove Avatar' })).toBeInTheDocument()
  })

  it('rejects oversized avatar file and does not call upload api', async () => {
    const user = userEvent.setup()
    const { container } = render(<ContactCard />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    const invalidFile = new File(['a'.repeat(MAX_AVATAR_SIZE + 1)], 'avatar.png', { type: 'image/png' })
    await user.upload(input, invalidFile)

    await waitFor(() => {
      expect(uploadAvatarMock).not.toHaveBeenCalled()
    })
  })

  it('rejects invalid avatar format and does not call upload api', async () => {
    const user = userEvent.setup()
    const { container } = render(<ContactCard />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    const invalidFile = new File(['avatar'], 'avatar.gif', { type: 'image/gif' })
    await user.upload(input, invalidFile)

    await waitFor(() => {
      expect(uploadAvatarMock).not.toHaveBeenCalled()
    })
  })

  it('uploads avatar successfully and refetches preview', async () => {
    uploadAvatarMock.mockResolvedValueOnce(undefined)
    refetchAvatarMock.mockResolvedValueOnce(undefined)

    const user = userEvent.setup()
    const { container } = render(<ContactCard />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    const validFile = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    await user.upload(input, validFile)

    await waitFor(() => {
      expect(uploadAvatarMock).toHaveBeenCalledTimes(1)
      expect(refetchAvatarMock).toHaveBeenCalledTimes(1)
    })
  })

  it('keeps flow safe when upload fails', async () => {
    uploadAvatarMock.mockRejectedValueOnce(new Error('upload failed'))

    const user = userEvent.setup()
    const { container } = render(<ContactCard />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    const validFile = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    await user.upload(input, validFile)

    await waitFor(() => {
      expect(uploadAvatarMock).toHaveBeenCalledTimes(1)
    })

    expect(refetchAvatarMock).not.toHaveBeenCalled()
  })
})
