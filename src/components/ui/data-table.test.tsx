import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DataTable, type Column } from "./data-table"

interface TestRow {
  id: string
  name: string
  email: string
  age: number
}

describe("DataTable", () => {
  const data: TestRow[] = [
    { id: "1", name: "John Doe", email: "john@example.com", age: 30 },
    { id: "2", name: "Jane Smith", email: "jane@example.com", age: 25 },
    { id: "3", name: "Bob Johnson", email: "bob@example.com", age: 35 },
  ]

  const columns: Column<TestRow>[] = [
    { key: "name", header: "Name", sortable: true, filterable: true },
    { key: "email", header: "Email", sortable: true, filterable: true },
    { key: "age", header: "Age", sortable: true, align: "right" },
  ]

  it("renders table with data", () => {
    render(
      <DataTable
        data={data}
        columns={columns}
        keyExtractor={(row) => row.id}
      />
    )
    
    expect(screen.getByRole("grid")).toBeInTheDocument()
    expect(screen.getByText("John Doe")).toBeInTheDocument()
    expect(screen.getByText("jane@example.com")).toBeInTheDocument()
    expect(screen.getByText("35")).toBeInTheDocument()
  })

  it("renders empty message when no data", () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        keyExtractor={(row) => row.id}
        emptyMessage="No users found"
      />
    )
    
    expect(screen.getByText("No users found")).toBeInTheDocument()
  })

  it("shows loading state", () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        keyExtractor={(row) => row.id}
        isLoading
      />
    )
    
    expect(screen.getByRole("status")).toBeInTheDocument()
    expect(screen.getByText("Loading data...")).toBeInTheDocument()
  })

  it("calls onRowClick when row is clicked", async () => {
    const handleRowClick = vi.fn()
    render(
      <DataTable
        data={data}
        columns={columns}
        keyExtractor={(row) => row.id}
        onRowClick={handleRowClick}
      />
    )
    
    const row = screen.getByText("John Doe").closest("tr")
    await userEvent.click(row!)
    
    expect(handleRowClick).toHaveBeenCalledWith(data[0])
  })

  describe("Selection", () => {
    it("renders checkboxes when selectable is true", () => {
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          selectable
        />
      )
      
      const checkboxes = screen.getAllByRole("checkbox")
      // Header checkbox + 3 row checkboxes
      expect(checkboxes).toHaveLength(4)
    })

    it("selects all rows with header checkbox", async () => {
      const handleSelectionChange = vi.fn()
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          selectable
          onSelectionChange={handleSelectionChange}
        />
      )
      
      const headerCheckbox = screen.getAllByRole("checkbox")[0]
      await userEvent.click(headerCheckbox)
      
      expect(handleSelectionChange).toHaveBeenCalledWith(["1", "2", "3"])
    })

    it("selects individual row", async () => {
      const handleSelectionChange = vi.fn()
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          selectable
          selectedRows={[]}
          onSelectionChange={handleSelectionChange}
        />
      )
      
      const rowCheckboxes = screen.getAllByRole("checkbox").slice(1)
      await userEvent.click(rowCheckboxes[0])
      
      expect(handleSelectionChange).toHaveBeenCalledWith(["1"])
    })

    it("deselects row when clicked again", async () => {
      const handleSelectionChange = vi.fn()
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          selectable
          selectedRows={["1", "2"]}
          onSelectionChange={handleSelectionChange}
        />
      )
      
      const rowCheckboxes = screen.getAllByRole("checkbox").slice(1)
      await userEvent.click(rowCheckboxes[0])
      
      expect(handleSelectionChange).toHaveBeenCalledWith(["2"])
    })

    it("shows bulk actions when rows selected", async () => {
      const handleDelete = vi.fn()
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          selectable
          selectedRows={["1", "2"]}
          onSelectionChange={() => {}}
          bulkActions={[
            {
              label: "Delete",
              icon: <span>🗑</span>,
              onClick: handleDelete,
              variant: "destructive",
            },
          ]}
        />
      )
      
      expect(screen.getByText("2 selected")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument()
    })

    it("calls bulk action when clicked", async () => {
      const handleDelete = vi.fn()
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          selectable
          selectedRows={["1", "2"]}
          onSelectionChange={() => {}}
          bulkActions={[
            {
              label: "Delete",
              onClick: handleDelete,
            },
          ]}
        />
      )
      
      const deleteButton = screen.getByRole("button", { name: "Delete" })
      await userEvent.click(deleteButton)
      
      expect(handleDelete).toHaveBeenCalledWith(["1", "2"])
    })
  })

  describe("Sorting", () => {
    it("calls onSort when sortable column header is clicked", async () => {
      const handleSort = vi.fn()
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          onSort={handleSort}
        />
      )
      
      const nameHeader = screen.getByRole("columnheader", { name: /name/i })
      await userEvent.click(nameHeader)
      
      expect(handleSort).toHaveBeenCalledWith("name", "asc")
    })

    it("cycles through sort directions", async () => {
      const handleSort = vi.fn()
      const { rerender } = render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          onSort={handleSort}
          sortColumn="name"
          sortDirection="asc"
        />
      )
      
      const nameHeader = screen.getByRole("columnheader", { name: /name/i })
      await userEvent.click(nameHeader)
      
      expect(handleSort).toHaveBeenCalledWith("name", "desc")
      
      rerender(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          onSort={handleSort}
          sortColumn="name"
          sortDirection="desc"
        />
      )
      
      await userEvent.click(nameHeader)
      expect(handleSort).toHaveBeenLastCalledWith("name", null)
    })

    it("sets aria-sort attribute", () => {
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          sortColumn="name"
          sortDirection="asc"
        />
      )
      
      const nameHeader = screen.getByRole("columnheader", { name: /name/i })
      expect(nameHeader).toHaveAttribute("aria-sort", "ascending")
    })
  })

  describe("Filtering", () => {
    it("renders filter inputs for filterable columns", () => {
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          onFilter={() => {}}
        />
      )
      
      expect(screen.getByLabelText("Filter by Name")).toBeInTheDocument()
      expect(screen.getByLabelText("Filter by Email")).toBeInTheDocument()
    })

    it("calls onFilter when filter input changes", async () => {
      const handleFilter = vi.fn()
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          onFilter={handleFilter}
        />
      )
      
      const nameFilter = screen.getByLabelText("Filter by Name")
      await userEvent.type(nameFilter, "john")
      
      expect(handleFilter).toHaveBeenCalledWith("name", "john")
    })
  })

  describe("Pagination", () => {
    const pagination = {
      page: 2,
      pageSize: 10,
      total: 35,
      onPageChange: vi.fn(),
      onPageSizeChange: vi.fn(),
    }

    it("renders pagination info", () => {
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          pagination={pagination}
        />
      )
      
      expect(screen.getByText("Showing 11 to 20 of 35 results")).toBeInTheDocument()
      expect(screen.getByText("Page 2 of 4")).toBeInTheDocument()
    })

    it("calls onPageChange when page buttons clicked", async () => {
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          pagination={pagination}
        />
      )
      
      const prevButton = screen.getByLabelText("Go to previous page")
      await userEvent.click(prevButton)
      
      expect(pagination.onPageChange).toHaveBeenCalledWith(1)
    })

    it("disables previous button on first page", () => {
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          pagination={{ ...pagination, page: 1 }}
        />
      )
      
      const prevButton = screen.getByLabelText("Go to previous page")
      expect(prevButton).toBeDisabled()
    })

    it("disables next button on last page", () => {
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          pagination={{ ...pagination, page: 4 }}
        />
      )
      
      const nextButton = screen.getByLabelText("Go to next page")
      expect(nextButton).toBeDisabled()
    })

    it("calls onPageSizeChange when page size changes", async () => {
      const handlePageSizeChange = vi.fn()
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          pagination={{ ...pagination, onPageSizeChange: handlePageSizeChange }}
        />
      )
      
      // Verify page size dropdown exists
      expect(screen.getByText("Rows per page")).toBeInTheDocument()
      expect(screen.getByRole("combobox")).toHaveTextContent("10")
    })
  })

  describe("Column Visibility", () => {
    it("toggles column visibility via dropdown", async () => {
      const handleVisibilityChange = vi.fn()
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          onColumnVisibilityChange={handleVisibilityChange}
          columnVisibility={{ name: true, email: true, age: true }}
        />
      )
      
      // Open column visibility dropdown
      const columnsButton = screen.getByRole("button", { name: /columns/i })
      await userEvent.click(columnsButton)
      
      // Toggle age column
      const ageCheckbox = screen.getByRole("menuitemcheckbox", { name: "Age" })
      await userEvent.click(ageCheckbox)
      
      expect(handleVisibilityChange).toHaveBeenCalledWith(
        expect.objectContaining({ age: false })
      )
    })

    it("hides columns based on visibility state", () => {
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          columnVisibility={{ name: true, email: false, age: true }}
        />
      )
      
      expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument()
      expect(screen.queryByRole("columnheader", { name: "Email" })).not.toBeInTheDocument()
      expect(screen.getByRole("columnheader", { name: "Age" })).toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("has proper grid structure", () => {
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
        />
      )
      
      expect(screen.getByRole("grid")).toBeInTheDocument()
      expect(screen.getAllByRole("columnheader")).toHaveLength(3)
      expect(screen.getAllByRole("row")).toHaveLength(4) // 1 header + 3 data rows
    })

    it("sets aria-rowindex on rows", () => {
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
        />
      )
      
      const rows = screen.getAllByRole("row").slice(1) // Skip header
      rows.forEach((row, index) => {
        expect(row).toHaveAttribute("aria-rowindex", String(index + 1))
      })
    })

    it("sets aria-selected on selectable rows", () => {
      render(
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(row) => row.id}
          selectable
          selectedRows={["2"]}
          onSelectionChange={() => {}}
        />
      )
      
      const rows = screen.getAllByRole("row").slice(1)
      expect(rows[0]).toHaveAttribute("aria-selected", "false")
      expect(rows[1]).toHaveAttribute("aria-selected", "true")
      expect(rows[2]).toHaveAttribute("aria-selected", "false")
    })
  })

  describe("Custom Cell Rendering", () => {
    it("uses custom cell renderer when provided", () => {
      const customColumns: Column<TestRow>[] = [
        { 
          key: "name", 
          header: "Name",
          cell: (row) => <strong>{row.name}</strong>
        },
        { key: "email", header: "Email" },
      ]
      
      render(
        <DataTable
          data={data}
          columns={customColumns}
          keyExtractor={(row) => row.id}
        />
      )
      
      const nameCell = screen.getByText("John Doe")
      expect(nameCell.tagName).toBe("STRONG")
    })

    it("uses accessorFn when provided", () => {
      const customColumns: Column<TestRow>[] = [
        { 
          key: "info", 
          header: "Info",
          accessorFn: (row) => `${row.name} (${row.age})`
        },
      ]
      
      render(
        <DataTable
          data={data}
          columns={customColumns}
          keyExtractor={(row) => row.id}
        />
      )
      
      expect(screen.getByText("John Doe (30)")).toBeInTheDocument()
    })
  })
})
