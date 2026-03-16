import { describe, it, expect } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import LoginPage from "@/app/login/page";

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

describe("Login Page", () => {
  it("should render login form with all fields", () => {
    render(<LoginPage />);

    // Check for branding
    expect(screen.getByText("GlobalShip CRM")).toBeDefined();
    expect(screen.getByText("Welcome Back")).toBeDefined();

    // Check for form fields
    expect(screen.getByLabelText(/Email Address/i)).toBeDefined();
    expect(screen.getByLabelText(/Password/i)).toBeDefined();
    expect(screen.getByLabelText(/Remember me for 30 days/i)).toBeDefined();

    // Check for submit button
    expect(screen.getByRole("button", { name: /Sign In/i })).toBeDefined();

    // Check for forgot password link
    expect(screen.getByText(/Forgot password/i)).toBeDefined();
  });

  it("should allow email input", () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    
    expect(emailInput.value).toBe("test@example.com");
  });

  it("should allow password input", () => {
    render(<LoginPage />);
    
    const passwordInput = screen.getByLabelText(/Password/i) as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    
    expect(passwordInput.value).toBe("password123");
  });

  it("should toggle remember me checkbox", () => {
    render(<LoginPage />);
    
    const rememberMeCheckbox = screen.getByLabelText(/Remember me for 30 days/i) as HTMLInputElement;
    
    expect(rememberMeCheckbox.checked).toBe(false);
    
    fireEvent.click(rememberMeCheckbox);
    
    expect(rememberMeCheckbox.checked).toBe(true);
  });

  it("should toggle password visibility", () => {
    render(<LoginPage />);
    
    const passwordInput = screen.getByLabelText(/Password/i) as HTMLInputElement;
    const toggleButtons = screen.getAllByRole("button");
    const toggleButton = toggleButtons[0];
    
    expect(passwordInput.type).toBe("password");
    
    fireEvent.click(toggleButton);
    
    expect(passwordInput.type).toBe("text");
  });
});
