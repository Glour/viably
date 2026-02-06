/**
 * Mock Auth API Functions for MVP Development
 *
 * These are CLIENT-SIDE mock functions that simulate backend auth API behavior.
 * Replace with real API calls when backend is ready.
 */

// Types
export type AuthResponse =
  | {
      success: true;
      user: { id: string; name: string; email: string };
      redirectTo: string;
    }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string>;
    };

export type ForgotPasswordResponse =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      error: string;
    };

// Mock API Functions

/**
 * Mock login function
 * @param data - Email and password credentials
 * @returns AuthResponse with user data or error
 */
export async function mockLogin(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test error case
  if (data.email === "error@test.com") {
    return {
      success: false,
      error: "Invalid email or password",
    };
  }

  // Success case
  return {
    success: true,
    user: {
      id: "mock-uuid",
      name: "Test User",
      email: data.email,
    },
    redirectTo: "/dashboard",
  };
}

/**
 * Mock register function
 * @param data - User registration data
 * @returns AuthResponse with user data or error
 */
export async function mockRegister(data: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test error case - email already taken
  if (data.email === "taken@test.com") {
    return {
      success: false,
      error: "An account with this email already exists",
    };
  }

  // Success case
  return {
    success: true,
    user: {
      id: "mock-uuid",
      name: data.name,
      email: data.email,
    },
    redirectTo: "/dashboard",
  };
}

/**
 * Mock forgot password function
 * @param data - Email address for password reset
 * @returns ForgotPasswordResponse with success message or error
 */
export async function mockForgotPassword(data: {
  email: string;
}): Promise<ForgotPasswordResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test error case - email not found
  if (data.email === "unknown@test.com") {
    return {
      success: false,
      error: "No account found with this email",
    };
  }

  // Success case
  return {
    success: true,
    message: "Reset link sent to " + data.email,
  };
}
