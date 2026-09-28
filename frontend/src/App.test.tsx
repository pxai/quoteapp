import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('renders the quote and version returned by the API', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      json: async () => ({
        version: '0.0.1',
        quote: { id: 1, text: 'A mocked quote.', author: 'A. Writer' },
      }),
    } as Response)
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)

    expect(await screen.findByText('A mocked quote.')).toBeTruthy()
    expect(await screen.findByText('version: 0.0.1')).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})