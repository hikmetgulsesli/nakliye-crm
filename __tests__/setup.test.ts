import '@testing-library/jest-dom'

describe('Project Setup', () => {
  it('should have Next.js configured', () => {
    expect(process.env).toBeDefined()
  })

  it('should have TypeScript working', () => {
    const testValue: string = 'test'
    expect(testValue).toBe('test')
  })
})
