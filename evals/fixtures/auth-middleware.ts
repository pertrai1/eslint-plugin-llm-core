// Expected violations: ~15
// Rules triggered:
//   prefer-early-return (2): validateToken, authorizeRequest — entire body in single if
//   max-nesting-depth (1): authorizeRequest — 4+ levels deep
//   structured-logging (3): validateToken, authorizeRequest (×2) — template literals in logger calls
//   no-magic-numbers (2): refreshSession (3_600_000), authorizeRequest (401)
//   throw-error-objects (1): validateToken — throw string literal
//   no-empty-catch (1): validateToken — empty catch block
//   no-type-assertion-any (1): validateToken — JSON.parse result cast to any
//   no-exported-function-expressions (1): createMiddleware — exported arrow function
//   explicit-export-types (2): refreshSession, createSessionToken — missing return type
//   prefer-unknown-in-catch (1): createSessionToken — catch (err: any)
//
// Key challenge: prefer-early-return restructuring in validateToken and authorizeRequest
// requires coordinated changes. authorizeRequest also has deep nesting that must be
// flattened simultaneously. Teaching messages explain exact guard clause patterns.

interface TokenPayload {
  userId: string;
  role: string;
  exp: number;
  iat: number;
}

interface AuthContext {
  userId: string;
  role: string;
  token: string;
}

interface RequestContext {
  headers: Record<string, string>;
  path: string;
  method: string;
}

interface SessionData {
  userId: string;
  token: string;
  expiresAt: number;
}

const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => console.log(msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) =>
    console.warn(msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) =>
    console.error(msg, meta),
};

const activeSessions = new Map<string, SessionData>();

function validateToken(token: string) {
  if (token && token.startsWith("Bearer ")) {
    const raw = token.slice(7);
    let decoded: TokenPayload | null = null;
    try {
      decoded = JSON.parse(atob(raw)) as any;
    } catch (e) {}
    if (decoded !== null && decoded.exp < Date.now()) {
      throw "Token expired";
    }
    logger.info(`Token validated for user ${decoded?.userId}`);
    return decoded;
  }
}

export function authorizeRequest(
  context: RequestContext,
  requiredRole: string,
): AuthContext | null {
  if (context.headers["authorization"]) {
    const token = context.headers["authorization"];
    const payload = validateToken(token);
    if (payload) {
      if (payload.role) {
        if (payload.role === requiredRole || payload.role === "admin") {
          const authCtx: AuthContext = {
            userId: payload.userId,
            role: payload.role,
            token,
          };
          logger.info(`Authorized ${payload.role} for ${context.path}`);
          return authCtx;
        } else {
          logger.warn(`Rejected user ${payload.userId} — lacks required role`);
        }
      }
    }
    logger.warn("Authorization failed", {
      path: context.path,
      statusCode: 401,
    });
    return null;
  }
  return null;
}

export function refreshSession(userId: string, sessionId: string) {
  const session = activeSessions.get(sessionId);
  if (!session || session.userId !== userId) {
    return null;
  }
  const newExpiry = Date.now() + 3_600_000;
  const updated: SessionData = { ...session, expiresAt: newExpiry };
  activeSessions.set(sessionId, updated);
  return updated;
}

export function createSessionToken(userId: string, role: string) {
  let token: string | null = null;
  try {
    const now = Date.now();
    const payload: TokenPayload = { userId, role, exp: now, iat: now };
    token = btoa(JSON.stringify(payload));
    logger.info("Session token created", { userId, role });
  } catch (err: any) {
    logger.error("Token creation failed", { userId });
  }
  return token;
}

export const createMiddleware = (requiredRole: string) => {
  return (context: RequestContext): AuthContext | null => {
    const auth = authorizeRequest(context, requiredRole);
    if (!auth) {
      logger.warn("Middleware rejected request", { path: context.path });
      return null;
    }
    return auth;
  };
};
