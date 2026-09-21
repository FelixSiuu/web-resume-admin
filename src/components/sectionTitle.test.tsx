import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SectionTitle from './sectionTitle'

describe('SectionTitle', () => {
  it('renders heading text with base class names', () => {
    render(<SectionTitle>Overview</SectionTitle>)
    const heading = screen.getByRole('heading', { level: 2, name: 'Overview' })
    expect(heading).toHaveClass('text-2xl', 'font-semibold')
  })

  it('merges custom className', () => {
    render(<SectionTitle className="custom-class">Contact</SectionTitle>)
    expect(screen.getByRole('heading', { name: 'Contact' })).toHaveClass('custom-class')
  })
})
