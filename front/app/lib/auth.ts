const API_URL = process.env.NEXT_PUBLIC_API_URL;
const TOKEN_KEY = "accessToken";

export type User = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};

function getApiUrl(): string {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  return API_URL.replace(/\/+$/, "");
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  return localStorage.getItem(TOKEN_KEY);
}

export function saveAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function readResponse<T>(response: Response): Promise<T> {
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "message" in data
        ? (data as { message: string | string[] }).message
        : "Request failed";

    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  return data as T;
}

// LOGIN: backend DTO expects identifier + password.
export async function login(input: {
  identifier: string;
  password: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${getApiUrl()}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      identifier: input.identifier.trim(),
      password: input.password,
    }),
  });

  const data = await readResponse<AuthResponse>(response);

  saveAccessToken(data.accessToken);

  return data;
}

// REGISTER: backend still accepts email OR phone separately.
export async function register(input: {
  name: string;
  email?: string;
  phone?: string;
  password: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${getApiUrl()}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = await readResponse<AuthResponse>(response);

  if (data.accessToken) {
    saveAccessToken(data.accessToken);
  }

  return data;
}

// RESTORE CURRENT USER using the access token.
export async function getCurrentUser(): Promise<User | null> {
  const token = getAccessToken();

  if (!token) return null;

  const response = await fetch(`${getApiUrl()}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    clearAccessToken();
    return null;
  }

  const data = await readResponse<User>(response);

  return data;
}

export function logout(): void {
  clearAccessToken();
}

// FORGOT PASSWORD: no reset token is stored in localStorage.
export async function forgotPassword(input: {
  identifier: string;
}): Promise<{ message: string }> {
  const response = await fetch(`${getApiUrl()}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      identifier: input.identifier.trim(),
    }),
  });

  return readResponse<{ message: string }>(response);
}

// RESET PASSWORD: browser sends the HttpOnly cookie automatically.
// The raw reset token is never read by frontend JavaScript.
export async function resetPassword(input: {
  newPassword: string;
}): Promise<{ message: string }> {
  const response = await fetch(`${getApiUrl()}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      newPassword: input.newPassword,
    }),
  });

  return readResponse<{ message: string }>(response);
}
