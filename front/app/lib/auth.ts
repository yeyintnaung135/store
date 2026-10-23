const API_URL = process.env.NEXT_PUBLIC_API_URL;
const TOKEN_KEY = "accessToken";

export type User = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: "ADMIN" | "CUSTOMER";
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

export async function login(input: {
  identifier: string;
  password: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${getApiUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      identifier: input.identifier.trim(),
      password: input.password,
    }),
  });

  const data = await readResponse<AuthResponse>(response);
  saveAccessToken(data.accessToken);

  return data;
}

export async function register(input: {
  name: string;
  email?: string;
  phone?: string;
  password: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${getApiUrl()}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  const data = await readResponse<AuthResponse>(response);

  if (data.accessToken) {
    saveAccessToken(data.accessToken);
  }

  return data;
}

export async function refreshSession(): Promise<AuthResponse> {
  const response = await fetch(`${getApiUrl()}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    clearAccessToken();
    throw new Error("Session expired. Please log in again.");
  }

  const data = await readResponse<AuthResponse>(response);
  saveAccessToken(data.accessToken);

  return data;
}

export async function getCurrentUser(): Promise<User | null> {
  let token = getAccessToken();

  if (!token) {
    try {
      const session = await refreshSession();
      token = session.accessToken;
    } catch {
      return null;
    }
  }

  let response = await fetch(`${getApiUrl()}/auth/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (response.status === 401) {
    try {
      const session = await refreshSession();

      response = await fetch(`${getApiUrl()}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        cache: "no-store",
      });
    } catch {
      clearAccessToken();
      return null;
    }
  }

  if (response.status === 401) {
    clearAccessToken();
    return null;
  }

  return readResponse<User>(response);
}

export async function logout(): Promise<void> {
  try {
    const response = await fetch(`${getApiUrl()}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Logout request failed");
    }
  } finally {
    clearAccessToken();
  }
}

export async function forgotPassword(input: {
  identifier: string;
}): Promise<{ message: string }> {
  const response = await fetch(`${getApiUrl()}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      identifier: input.identifier.trim(),
    }),
  });

  return readResponse<{ message: string }>(response);
}

export async function resetPassword(input: {
  newPassword: string;
}): Promise<{ message: string }> {
  const response = await fetch(`${getApiUrl()}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      password: input.newPassword,
    }),
  });

  return readResponse<{ message: string }>(response);
}
