import { userTable } from "@/db/schema/user";
import { Auth } from "@/lib/auth";
import { withDbRetry } from "@/db";
import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

// SEC-HIGH-05: Server-side sliding window login attempt limiter
interface LoginAttemptRecord {
  count: number;
  firstAttempt: number;
  lockedUntil?: number;
}

const loginAttempts = new Map<string, LoginAttemptRecord>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getClientIdentifier(request: Request, clientAddress?: string): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) return xForwardedFor.split(",")[0].trim();
  if (clientAddress) return clientAddress.trim();
  return "direct-client";
}

function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (!record) return { allowed: true };

  // If locked out, check if window expired
  if (record.lockedUntil) {
    if (now < record.lockedUntil) {
      const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return { allowed: false, retryAfterSeconds };
    } else {
      loginAttempts.delete(key);
      return { allowed: true };
    }
  }

  // Check if first attempt was older than the window
  if (now - record.firstAttempt > LOCKOUT_WINDOW_MS) {
    loginAttempts.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record || now - record.firstAttempt > LOCKOUT_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAttempt: now });
    return;
  }

  record.count += 1;
  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_WINDOW_MS;
  }
}

function clearRateLimit(key: string): void {
  loginAttempts.delete(key);
}

export const authActions = {
  signUp: defineAction({
    input: z.object({
      name: z.string().min(3),
      email: z.string().email(),
      phone_number: z.string(),
      password: z.string().min(8),
    }),
    handler: async (input, context) => {
      // SEC-CRIT-01: Restrict registration to authenticated administrators only
      const currentAdmin = context.locals.user;
      const currentSession = context.locals.session;

      if (!currentAdmin || !currentSession) {
        throw new ActionError({
          code: "UNAUTHORIZED",
          message: "Administrator authentication is required to register new user accounts.",
        });
      }

      const { db } = context.locals;

      try {
        const runtimeEnv = (context.locals as any)?.runtime?.env;
        const existingUser = await withDbRetry(async (database) => {
          const [u] = await database
            .select()
            .from(userTable)
            .where(eq(userTable.username, input.name));
          return u;
        }, runtimeEnv);

        if (existingUser) {
          throw new ActionError({
            code: "CONFLICT",
            message: "User already exists",
          });
        }

        const userId = crypto.randomUUID();
        const hashedPassword = await bcrypt.hash(input.password, 10);

        await withDbRetry(async (database) => {
          await database.insert(userTable).values({
            id: userId,
            username: input.name,
            password_hash: hashedPassword,
          });
        }, runtimeEnv);

        // Legitimate administrative user creation: do NOT overwrite current admin's session
        return {
          success: true,
          message: "User account created successfully",
          userId,
        };
      } catch (error) {
        if (error instanceof ActionError) throw error;

        console.error("User creation error for account:", input.name);

        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An internal error occurred during user account creation.",
        });
      }
    },
  }),

  logIn: defineAction({
    input: z.object({
      username: z.string(),
      password: z.string(),
    }),
    handler: async (input, context) => {
      const clientIp = getClientIdentifier(context.request, (context as any).clientAddress);
      const normalizedUsername = input.username.toLowerCase().trim();
      const rateLimitKey = `${clientIp}:${normalizedUsername}`;

      // Check login rate limiting
      const rateCheck = checkRateLimit(rateLimitKey);
      if (!rateCheck.allowed) {
        throw new ActionError({
          code: "TOO_MANY_REQUESTS",
          message: `Too many failed login attempts. Please wait ${rateCheck.retryAfterSeconds || 900} seconds before trying again.`,
        });
      }

      const { db } = context.locals;
      const auth = Auth.getInstance(db);
      try {
        const runtimeEnv = (context.locals as any)?.runtime?.env;
        const user = await withDbRetry(async (database) => {
          const [u] = await database
            .select()
            .from(userTable)
            .where(eq(userTable.username, input.username));
          return u;
        }, runtimeEnv);

        if (!user) {
          // Record failed attempt to prevent username enumeration timing
          recordFailedAttempt(rateLimitKey);
          throw new ActionError({
            code: "UNAUTHORIZED",
            message: "Invalid credentials",
          });
        }

        const isValidPassword = await bcrypt.compare(
          input.password,
          user.password_hash
        );

        if (!isValidPassword) {
          recordFailedAttempt(rateLimitKey);
          throw new ActionError({
            code: "UNAUTHORIZED",
            message: "Invalid credentials",
          });
        }

        // Login success: reset rate limit counter
        clearRateLimit(rateLimitKey);

        const session = await auth.createSession(user.id);
        const sessionCookie = auth.createSessionCookie(session.id);
        context.cookies.set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes
        );

        return {
          success: true,
          message: "Login successful",
        };
      } catch (error) {
        if (error instanceof ActionError) throw error;

        console.error("Login attempt failed for username:", input.username);

        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An internal error occurred during login.",
        });
      }
    },
  }),

  // SEC-HIGH-03: Server-side secure session termination action
  logOut: defineAction({
    handler: async (_input, context) => {
      const { db } = context.locals;
      const session = context.locals.session;

      if (session && db) {
        const auth = Auth.getInstance(db);
        await auth.invalidateSession(session.id);
      }

      if (db) {
        const auth = Auth.getInstance(db);
        const clearCookie = auth.clearSessionCookie();
        context.cookies.set(
          clearCookie.name,
          clearCookie.value,
          clearCookie.attributes
        );
      }

      return {
        success: true,
        message: "Logged out successfully",
      };
    },
  }),
};
