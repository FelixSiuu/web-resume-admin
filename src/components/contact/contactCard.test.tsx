import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ContactCard from './contactCard'

const updateContactMock = vi.fn()
let mockData: Contact | undefined

vi.mock('@/hooks/useContactHooks', () => ({
  default: () => ({
    data: mockData,
    isLoading: false,
    updateContact: updateContactMock,
    isUpdateLoading: false
  })
}))

describe('ContactCard', () => {
  beforeEach(() => {
    mockData = undefined
    updateContactMock.mockClear()
  })

  it('submits normalized contact payload', async () => {
    const user = userEvent.setup()
    render(<ContactCard />)

    await user.type(screen.getByLabelText('Display Name'), '  Felix Siu  ')
    await user.type(screen.getByLabelText('Title'), '  Frontend Engineer ')
    await user.type(screen.getByLabelText('Email'), 'felix@example.com')
    await user.type(screen.getByLabelText('Phone'), '  ')
    await user.type(screen.getByLabelText('Address'), '  Kowloon  ')
    await user.click(screen.getByRole('button', { name: 'Save Contact' }))

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
})
