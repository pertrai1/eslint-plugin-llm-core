// Expected violations: 19
// Rules triggered:
//   no-exported-function-expressions (3): buildAuthHeaders, parseApiError, listUsers
//   explicit-export-types (5): buildAuthHeaders (return), parseApiError (param + return),
//                               listUsers (return), deleteUser (return)
//   structured-logging (4): parseApiError, fetchUser, createUser, updateUser
//   no-type-assertion-any (2): fetchUser (response as any), listUsers (json() as any)
//   no-magic-numbers (3): createUser (201, 400), updateUser (5000)
//   prefer-early-return (2): createUser, updateUser
//
// Key challenge: arrow exports that ALSO need type annotations added — the LLM must
// convert to a declaration AND add types simultaneously. Terse messages only say what's
// wrong; the teaching message shows the exact combined transformation.

interface User {
  id: string;
  email: string;
  role: "admin" | "viewer" | "editor";
  active: boolean;
  createdAt: string;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

interface UserFilters {
  role?: User["role"];
  active?: boolean;
  search?: string;
}

const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => console.log(msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) =>
    console.warn(msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) =>
    console.error(msg, meta),
};

function buildQueryString(filters: UserFilters): string {
  const params = new URLSearchParams();
  if (filters.role) params.set("role", filters.role);
  if (filters.active !== undefined)
    params.set("active", String(filters.active));
  if (filters.search) params.set("search", filters.search);
  return params.toString();
}

// VIOLATION: no-exported-function-expressions (1)
// VIOLATION: explicit-export-types — missing return type (1)
export const buildAuthHeaders = (token: string) => {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

// VIOLATION: no-exported-function-expressions (1)
// VIOLATION: explicit-export-types — missing param type for 'response' (1)
// VIOLATION: explicit-export-types — missing return type (1)
// VIOLATION: structured-logging — template literal in logger.error (1)
export const parseApiError = (response) => {
  logger.error(`API request failed with status ${response.status}`);
  return new Error(response.message ?? "Unknown error");
};

// VIOLATION: no-type-assertion-any — response as any (1)
// VIOLATION: structured-logging — template literal in logger.info (1)
export async function fetchUser(userId: string): Promise<User> {
  const response = await fetch(`/api/users/${userId}`);
  const raw = await (response as any).json();
  logger.info(`Fetched user data for ${userId}`);
  return raw as User;
}

// VIOLATION: prefer-early-return — entire body wrapped in single if (1)
// VIOLATION: no-magic-numbers — 201 (1)
// VIOLATION: no-magic-numbers — 400 (1)
// VIOLATION: structured-logging — template literal in logger.info (1)
export async function createUser(
  payload: Partial<User>,
): Promise<ApiResponse<User>> {
  if (payload.email && payload.role) {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    logger.info(`User created with email ${payload.email}`);
    return {
      data: data as User,
      status: response.ok ? 201 : 400,
      message: response.ok ? "Created" : "Failed",
    };
  }
}

// VIOLATION: prefer-early-return — entire body wrapped in single if (1)
// VIOLATION: no-magic-numbers — 5000 (1)
// VIOLATION: structured-logging — template literal in logger.warn (1)
export async function updateUser(
  userId: string,
  updates: Partial<User>,
): Promise<User> {
  if (updates && Object.keys(updates).length > 0) {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
      signal: controller.signal,
    });
    if (!response.ok) {
      logger.warn(`Failed to update user ${userId}`);
      throw new Error("Update failed");
    }
    return response.json();
  }
}

// VIOLATION: no-exported-function-expressions (1)
// VIOLATION: explicit-export-types — missing return type (1)
// VIOLATION: no-type-assertion-any — json() as any (1)
export const listUsers = async (page: number, filters: UserFilters) => {
  const qs = buildQueryString(filters);
  const response = await fetch(`/api/users?page=${page}&${qs}`);
  return (await response.json()) as any;
};

// VIOLATION: explicit-export-types — missing return type (1)
export async function deleteUser(userId: string) {
  const response = await fetch(`/api/users/${userId}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(`Delete failed for user ${userId}`);
  }
}
