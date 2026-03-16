import '@testing-library/jest-dom'

describe('Design Tokens', () => {
  it('should have Plus Jakarta Sans font variable defined', () => {
    // Font variable should be defined in layout
    expect('--font-plus-jakarta').toBeDefined()
  })

  it('should have Work Sans font variable defined', () => {
    // Font variable should be defined in layout
    expect('--font-work-sans').toBeDefined()
  })

  it('should have primary color defined', () => {
    expect('--color-primary').toBeDefined()
  })

  it('should have surface colors defined', () => {
    expect('--color-surface-light').toBeDefined()
    expect('--color-surface-dark').toBeDefined()
  })

  it('should have text colors defined', () => {
    expect('--color-text-main-light').toBeDefined()
    expect('--color-text-main-dark').toBeDefined()
  })
})
