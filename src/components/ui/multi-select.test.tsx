import { describe, it, expect, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MultiSelect } from "./multi-select"

describe("MultiSelect", () => {
  const options = [
    { value: "1", label: "Option 1" },
    { value: "2", label: "Option 2" },
    { value: "3", label: "Option 3" },
  ]

  it("renders with placeholder", () => {
    render(
      <MultiSelect
        options={options}
        value={[]}
        onChange={() => {}}
        placeholder="Select items..."
      />
    )
    expect(screen.getByText("Select items...")).toBeInTheDocument()
  })

  it("renders selected options as badges", () => {
    render(
      <MultiSelect
        options={options}
        value={["1", "2"]}
        onChange={() => {}}
      />
    )
    expect(screen.getByText("Option 1")).toBeInTheDocument()
    expect(screen.getByText("Option 2")).toBeInTheDocument()
  })

  it("opens dropdown on click", async () => {
    render(
      <MultiSelect
        options={options}
        value={[]}
        onChange={() => {}}
      />
    )
    
    const button = screen.getByRole("button")
    await userEvent.click(button)
    
    expect(screen.getByRole("listbox")).toBeInTheDocument()
    expect(screen.getByText("Option 1")).toBeInTheDocument()
    expect(screen.getByText("Option 2")).toBeInTheDocument()
    expect(screen.getByText("Option 3")).toBeInTheDocument()
  })

  it("selects option on click", async () => {
    const handleChange = vi.fn()
    render(
      <MultiSelect
        options={options}
        value={[]}
        onChange={handleChange}
      />
    )
    
    const button = screen.getByRole("button")
    await userEvent.click(button)
    
    const option = screen.getByRole("option", { name: "Option 1" })
    await userEvent.click(option)
    
    expect(handleChange).toHaveBeenCalledWith(["1"])
  })

  it("deselects option on second click", async () => {
    const handleChange = vi.fn()
    render(
      <MultiSelect
        options={options}
        value={["1"]}
        onChange={handleChange}
      />
    )
    
    const button = screen.getByRole("button")
    await userEvent.click(button)
    
    const option = screen.getByRole("option", { name: "Option 1" })
    await userEvent.click(option)
    
    expect(handleChange).toHaveBeenCalledWith([])
  })

  it("filters options based on search", async () => {
    render(
      <MultiSelect
        options={options}
        value={[]}
        onChange={() => {}}
      />
    )
    
    const button = screen.getByRole("button")
    await userEvent.click(button)
    
    const searchInput = screen.getByLabelText("Search options")
    await userEvent.type(searchInput, "Option 1")
    
    expect(screen.getByText("Option 1")).toBeInTheDocument()
    expect(screen.queryByText("Option 2")).not.toBeInTheDocument()
    expect(screen.queryByText("Option 3")).not.toBeInTheDocument()
  })

  it("shows 'No options found' when search has no results", async () => {
    render(
      <MultiSelect
        options={options}
        value={[]}
        onChange={() => {}}
      />
    )
    
    const button = screen.getByRole("button")
    await userEvent.click(button)
    
    const searchInput = screen.getByLabelText("Search options")
    await userEvent.type(searchInput, "nonexistent")
    
    expect(screen.getByText("No options found")).toBeInTheDocument()
  })

  it("selects all options with 'Select All'", async () => {
    const handleChange = vi.fn()
    render(
      <MultiSelect
        options={options}
        value={[]}
        onChange={handleChange}
      />
    )
    
    const button = screen.getByRole("button")
    await userEvent.click(button)
    
    const selectAllButton = screen.getByRole("button", { name: /select all/i })
    await userEvent.click(selectAllButton)
    
    expect(handleChange).toHaveBeenCalledWith(["1", "2", "3"])
  })

  it("deselects all options with 'Deselect All'", async () => {
    const handleChange = vi.fn()
    render(
      <MultiSelect
        options={options}
        value={["1", "2", "3"]}
        onChange={handleChange}
      />
    )
    
    const button = screen.getByRole("button")
    await userEvent.click(button)
    
    const deselectAllButton = screen.getByRole("button", { name: /deselect all/i })
    await userEvent.click(deselectAllButton)
    
    expect(handleChange).toHaveBeenCalledWith([])
  })

  it("removes option via badge remove button", async () => {
    const handleChange = vi.fn()
    render(
      <MultiSelect
        options={options}
        value={["1", "2"]}
        onChange={handleChange}
      />
    )
    
    const removeButton = screen.getByLabelText("Remove Option 1")
    await userEvent.click(removeButton)
    
    expect(handleChange).toHaveBeenCalledWith(["2"])
  })

  it("has proper ARIA attributes", () => {
    render(
      <MultiSelect
        options={options}
        value={[]}
        onChange={() => {}}
        label="Test Label"
        aria-label="Test MultiSelect"
      />
    )
    
    const combobox = screen.getByRole("combobox")
    expect(combobox).toHaveAttribute("aria-label", "Test MultiSelect")
    expect(combobox).toHaveAttribute("aria-expanded", "false")
    expect(combobox).toHaveAttribute("aria-haspopup", "listbox")
  })

  it("supports keyboard navigation", async () => {
    const handleChange = vi.fn()
    render(
      <MultiSelect
        options={options}
        value={[]}
        onChange={handleChange}
      />
    )
    
    const combobox = screen.getByRole("combobox")
    combobox.focus()
    
    // Open with Enter
    await userEvent.keyboard("{Enter}")
    expect(screen.getByRole("listbox")).toBeInTheDocument()
    
    // Navigate with arrow keys
    await userEvent.keyboard("{ArrowDown}")
    await userEvent.keyboard("{Enter}")
    
    expect(handleChange).toHaveBeenCalledWith(["1"])
  })

  it("closes on Escape key", async () => {
    render(
      <MultiSelect
        options={options}
        value={[]}
        onChange={() => {}}
      />
    )
    
    const button = screen.getByRole("button")
    await userEvent.click(button)
    
    expect(screen.getByRole("listbox")).toBeInTheDocument()
    
    await userEvent.keyboard("{Escape}")
    
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    })
  })

  it("closes on click outside", async () => {
    render(
      <>
        <MultiSelect
          options={options}
          value={[]}
          onChange={() => {}}
        />
        <div data-testid="outside">Outside</div>
      </>
    )
    
    const button = screen.getByRole("button")
    await userEvent.click(button)
    
    expect(screen.getByRole("listbox")).toBeInTheDocument()
    
    await userEvent.click(screen.getByTestId("outside"))
    
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    })
  })

  it("shows label when provided", () => {
    render(
      <MultiSelect
        options={options}
        value={[]}
        onChange={() => {}}
        label="Test Label"
      />
    )
    
    expect(screen.getByText("Test Label")).toBeInTheDocument()
  })

  it("respects disabled prop", () => {
    render(
      <MultiSelect
        options={options}
        value={[]}
        onChange={() => {}}
        disabled
      />
    )
    
    const combobox = screen.getByRole("combobox")
    expect(combobox).toHaveAttribute("aria-disabled", "true")
    expect(combobox).toHaveAttribute("tabindex", "-1")
  })
})
