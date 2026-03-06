import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Textarea } from "./textarea"

describe("Textarea", () => {
  it("renders textarea element", () => {
    render(<Textarea placeholder="Enter text..." />)
    expect(screen.getByPlaceholderText("Enter text...")).toBeInTheDocument()
  })

  it("accepts and displays value", () => {
    render(<Textarea value="Test content" readOnly />)
    expect(screen.getByDisplayValue("Test content")).toBeInTheDocument()
  })

  it("handles onChange events", async () => {
    const handleChange = vi.fn()
    render(<Textarea onChange={handleChange} />)
    
    const textarea = screen.getByRole("textbox")
    await userEvent.type(textarea, "Hello")
    
    expect(handleChange).toHaveBeenCalled()
  })

  it("applies disabled state", () => {
    render(<Textarea disabled />)
    expect(screen.getByRole("textbox")).toBeDisabled()
  })

  it("applies custom className", () => {
    render(<Textarea className="custom-class" data-testid="textarea" />)
    expect(screen.getByTestId("textarea")).toHaveClass("custom-class")
  })

  it("forwards ref correctly", () => {
    const ref = { current: null as HTMLTextAreaElement | null }
    render(<Textarea ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
  })

  it("has proper default styling", () => {
    render(<Textarea data-testid="textarea" />)
    const textarea = screen.getByTestId("textarea")
    
    expect(textarea).toHaveClass("flex", "min-h-[80px]", "w-full", "rounded-md")
  })

  it("supports rows attribute", () => {
    render(<Textarea rows={5} data-testid="textarea" />)
    expect(screen.getByTestId("textarea")).toHaveAttribute("rows", "5")
  })

  it("supports maxLength attribute", () => {
    render(<Textarea maxLength={100} data-testid="textarea" />)
    expect(screen.getByTestId("textarea")).toHaveAttribute("maxLength", "100")
  })
})
