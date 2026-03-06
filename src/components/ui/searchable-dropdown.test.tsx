import { describe, it, expect, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SearchableDropdown } from "./searchable-dropdown"

describe("SearchableDropdown", () => {
  const options = [
    { value: "1", label: "Option 1" },
    { value: "2", label: "Option 2" },
    { value: "3", label: "Option 3" },
  ]

  it("renders with placeholder", () => {
    render(
      <SearchableDropdown
        options={options}
        value={null}
        onChange={() => {}}
        placeholder="Select an item..."
      />
    )
    expect(screen.getByText("Select an item...")).toBeInTheDocument()
  })

  it("renders selected option label", () => {
    render(
      <SearchableDropdown
        options={options}
        value="2"
        onChange={() => {}}
      />
    )
    expect(screen.getByText("Option 2")).toBeInTheDocument()
  })

  it("opens dropdown on click", async () => {
    render(
      <SearchableDropdown
        options={options}
        value={null}
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
      <SearchableDropdown
        options={options}
        value={null}
        onChange={handleChange}
      />
    )
    
    const button = screen.getByRole("button")
    await userEvent.click(button)
    
    const option = screen.getByRole("option", { name: "Option 1" })
    await userEvent.click(option)
    
    expect(handleChange).toHaveBeenCalledWith("1")
  })

  it("closes dropdown after selection", async () => {
    const handleChange = vi.fn()
    render(
      <SearchableDropdown
        options={options}
        value={null}
        onChange={handleChange}
      />
    )
    
    const button = screen.getByRole("button")
    await userEvent.click(button)
    
    const option = screen.getByRole("option", { name: "Option 1" })
    await userEvent.click(option)
    
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    })
  })

  it("filters options based on search", async () => {
    render(
      <SearchableDropdown
        options={options}
        value={null}
        onChange={() => {}}
      />
    )
    
    const button = screen.getByRole("button")
    await userEvent.click(button)
    
    const searchInput = screen.getByLabelText("Search options")
    await userEvent.type(searchInput, "Option 2")
    
    await waitFor(() => {
      expect(screen.queryByText("Option 1")).not.toBeInTheDocument()
      expect(screen.getByText("Option 2")).toBeInTheDocument()
      expect(screen.queryByText("Option 3")).not.toBeInTheDocument()
    })
  })

  it("shows 'No options found' when search has no results", async () => {
    render(
      <SearchableDropdown
        options={options}
        value={null}
        onChange={() => {}}
      />
    )
    
    const button = screen.getByRole("button")
    await userEvent.click(button)
    
    const searchInput = screen.getByLabelText("Search options")
    await userEvent.type(searchInput, "nonexistent")
    
    await waitFor(() => {
      expect(screen.getByText("No options found")).toBeInTheDocument()
    })
  })

  it("clears selection when clear button clicked", async () => {
    const handleChange = vi.fn()
    render(
      <SearchableDropdown
        options={options}
        value="2"
        onChange={handleChange}
        clearable
      />
    )
    
    const clearButton = screen.getByLabelText("Clear selection")
    await userEvent.click(clearButton)
    
    expect(handleChange).toHaveBeenCalledWith(null)
  })

  it("calls onSearch when search query changes (debounced)", async () => {
    const handleSearch = vi.fn().mockResolvedValue([
      { value: "search1", label: "Search Result 1" },
    ])
    
    render(
      <SearchableDropdown
        options={[]}
        value={null}
        onChange={() => {}}
        onSearch={handleSearch}
        debounceMs={100}
      />
    )
    
    const button = screen.getByRole("button")
    await userEvent.click(button)
    
    const searchInput = screen.getByLabelText("Search options")
    await userEvent.type(searchInput, "test")
    
    // Should not be called immediately due to debounce
    expect(handleSearch).not.toHaveBeenCalled()
    
    // Wait for debounce
    await waitFor(() => {
      expect(handleSearch).toHaveBeenCalledWith("test")
    }, { timeout: 200 })
  })

  it("displays loading state during async search", async () => {
    const handleSearch = vi.fn().mockImplementation(() => 
      new Promise((resolve) => setTimeout(() => resolve([]), 100))
    )
    
    render(
      <SearchableDropdown
        options={[]}
        value={null}
        onChange={() => {}}
        onSearch={handleSearch}
        debounceMs={50}
      />
    )
    
    const button = screen.getByRole("button")
    await userEvent.click(button)
    
    const searchInput = screen.getByLabelText("Search options")
    await userEvent.type(searchInput, "test")
    
    await waitFor(() => {
      expect(screen.getByText("Loading...")).toBeInTheDocument()
    })
  })

  it("has proper ARIA attributes", () => {
    render(
      <SearchableDropdown
        options={options}
        value={null}
        onChange={() => {}}
        label="Test Label"
        aria-label="Test Dropdown"
      />
    )
    
    const combobox = screen.getByRole("combobox")
    expect(combobox).toHaveAttribute("aria-label", "Test Dropdown")
    expect(combobox).toHaveAttribute("aria-expanded", "false")
    expect(combobox).toHaveAttribute("aria-haspopup", "listbox")
  })

  it("supports keyboard navigation", async () => {
    const handleChange = vi.fn()
    render(
      <SearchableDropdown
        options={options}
        value={null}
        onChange={handleChange}
      />
    )
    
    const combobox = screen.getByRole("combobox")
    combobox.focus()
    
    // Open with Enter
    await userEvent.keyboard("{Enter}")
    expect(screen.getByRole("listbox")).toBeInTheDocument()
    
    // Navigate with arrow keys and select
    await userEvent.keyboard("{ArrowDown}")
    await userEvent.keyboard("{Enter}")
    
    expect(handleChange).toHaveBeenCalledWith("1")
  })

  it("closes on Escape key", async () => {
    render(
      <SearchableDropdown
        options={options}
        value={null}
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
        <SearchableDropdown
          options={options}
          value={null}
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
      <SearchableDropdown
        options={options}
        value={null}
        onChange={() => {}}
        label="Test Label"
      />
    )
    
    expect(screen.getByText("Test Label")).toBeInTheDocument()
  })

  it("respects disabled prop", () => {
    render(
      <SearchableDropdown
        options={options}
        value={null}
        onChange={() => {}}
        disabled
      />
    )
    
    const combobox = screen.getByRole("combobox")
    expect(combobox).toHaveAttribute("aria-disabled", "true")
    expect(combobox).toHaveAttribute("tabindex", "-1")
  })

  it("displays correct aria-selected for options", async () => {
    render(
      <SearchableDropdown
        options={options}
        value="2"
        onChange={() => {}}
        clearable={false}
      />
    )
    
    const combobox = screen.getByRole("combobox")
    await userEvent.click(combobox)
    
    const option1 = screen.getByRole("option", { name: "Option 1" })
    const option2 = screen.getByRole("option", { name: "Option 2" })
    
    expect(option1).toHaveAttribute("aria-selected", "false")
    expect(option2).toHaveAttribute("aria-selected", "true")
  })

  it("respects disabled options", async () => {
    const disabledOptions = [
      { value: "1", label: "Option 1" },
      { value: "2", label: "Option 2", disabled: true },
    ]
    
    render(
      <SearchableDropdown
        options={disabledOptions}
        value={null}
        onChange={() => {}}
      />
    )
    
    const button = screen.getByRole("button")
    await userEvent.click(button)
    
    const disabledOption = screen.getByRole("option", { name: "Option 2" })
    expect(disabledOption).toHaveAttribute("aria-disabled", "true")
  })
})
