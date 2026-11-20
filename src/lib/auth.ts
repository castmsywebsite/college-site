import { sessionTable } from "@/db/schema/session";
import { userTable } from "@/db/schema/user";
import type { AstroCookieSetOptions } from "astro";
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { isConnectionError, resetDbClient } from "@/db";

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
}

export interface User {
  id: string;
  username: string;
}

export interface SessionCookie {
  name: string;
  value: string;
  attributes: AstroCookieSetOptions;
}

export class Auth {
  private static instance: Auth | null = null;
  private readonly sessionDurationSeconds = 60 * 60 * 24 * 30;
  private db: PostgresJsDatabase<Record<string, never>>;
  public static sessionCookieName = "sessionId";

  private constructor(db: PostgresJsDatabase<Record<string, never>>) {
    this.db = db;
  }

  public static getInstance(
    db: PostgresJsDatabase<Record<string, never>>
  ): Auth {
    if (!Auth.instance) {
      Auth.instance = new Auth(db);
    } else {
      Auth.instance.db = db;
    }
    return Auth.instance;
  }

  public updateDb(db: PostgresJsDatabase<Record<string, never>>) {
    this.db = db;
  }

  private generateSessionId(): string {
    return crypto.randomUUID();
  }

  public async createSession(userId: string): Promise<Session> {
    const now = Date.now();
    const session: Session = {
      id: this.generateSessionId(),
      userId,
      expiresAt: new Date(now + this.sessionDurationSeconds * 1000),
    };

    if (this.db) {
      try {
        await this.db.insert(sessionTable).values(session);
        return session;
      } catch (err: any) {
        if (isConnectionError(err)) {
          console.warn("createSession: DB connection dropped, retrying with fresh client...");
          try {
            this.db = resetDbClient() as unknown as PostgresJsDatabase<Record<string, never>>;
            await this.db.insert(sessionTable).values(session);
            return session;
          } catch (retryErr) {
            console.warn("createSession DB retry failed, falling back to REST:", retryErr);
          }
        }
      }
    }

    try {
      const { supabaseAdmin, supabase } = await import("./supabase");
      const client = supabaseAdmin || supabase;
      const { error } = await client.from("session").insert({
        id: session.id,
        user_id: session.userId,
        expires_at: session.expiresAt.toISOString(),
      });
      if (error) throw error;
      return session;
    } catch (restErr) {
      console.error("createSession REST fallback failed:", restErr);
      throw restErr;
    }
  }

  private async executeValidate(
    sessionId: string
  ): Promise<{ session: Session | null; user: User | null }> {
    const now = Date.now();

    let sessionRows: any[] = [];
    if (this.db) {
      try {
        sessionRows = await this.db
          .select()
          .from(sessionTable)
          .where(eq(sessionTable.id, sessionId));
      } catch (dbErr) {
        console.warn("Auth DB validate failed, trying Supabase REST:", dbErr);
      }
    }

    if (sessionRows.length === 0) {
      try {
        const { supabaseAdmin, supabase } = await import("./supabase");
        const client = supabaseAdmin || supabase;
        const { data } = await client.from("session").select("*").eq("id", sessionId);
        if (data && data.length > 0) {
          sessionRows = data.map((s: any) => ({
            id: s.id,
            userId: s.user_id,
            expiresAt: new Date(s.expires_at),
          }));
        }
      } catch (restErr) {
        console.warn("Auth REST fallback failed:", restErr);
      }
    }

    if (sessionRows.length === 0) return { session: null, user: null };

    const session: Session = {
      id: sessionRows[0].id,
      userId: sessionRows[0].userId,
      expiresAt: sessionRows[0].expiresAt,
    };

    if (now >= session.expiresAt.getTime()) {
      if (this.db) {
        try {
          await this.db.delete(sessionTable).where(eq(sessionTable.id, session.id));
        } catch (delErr) {
          console.warn("Failed to delete expired session:", delErr);
        }
      }
      return { session: null, user: null };
    }

    let userData: any = null;
    if (this.db) {
      try {
        const [u] = await this.db
          .select()
          .from(userTable)
          .where(eq(userTable.id, session.userId));
        userData = u;
      } catch {}
    }

    if (!userData) {
      try {
        const { supabaseAdmin, supabase } = await import("./supabase");
        const client = supabaseAdmin || supabase;
        const { data } = await client.from("user").select("id, username").eq("id", session.userId);
        if (data && data.length > 0) {
          userData = data[0];
        }
      } catch {}
    }

    if (!userData) return { session: null, user: null };

    const user: User = {
      id: userData.id,
      username: userData.username,
    };

    return { session, user };
  }

  public async validateSession(
    sessionId: string
  ): Promise<{ session: Session | null; user: User | null }> {
    try {
      return await this.executeValidate(sessionId);
    } catch (err: any) {
      if (isConnectionError(err)) {
        console.warn("validateSession: DB connection dropped, retrying with fresh client...");
        try {
          this.db = resetDbClient() as unknown as PostgresJsDatabase<Record<string, never>>;
          return await this.executeValidate(sessionId);
        } catch (retryErr) {
          console.error("validateSession retry failed:", retryErr);
          return { session: null, user: null };
        }
      }
      console.error("validateSession error:", err);
      return { session: null, user: null };
    }
  }

  public async invalidateSession(sessionId: string): Promise<void> {
    if (this.db) {
      try {
        await this.db.delete(sessionTable).where(eq(sessionTable.id, sessionId));
        return;
      } catch (err: any) {
        if (isConnectionError(err)) {
          console.warn("invalidateSession: DB connection dropped, retrying with fresh client...");
          try {
            this.db = resetDbClient() as unknown as PostgresJsDatabase<Record<string, never>>;
            await this.db.delete(sessionTable).where(eq(sessionTable.id, sessionId));
            return;
          } catch {}
        }
      }
    }

    try {
      const { supabaseAdmin, supabase } = await import("./supabase");
      const client = supabaseAdmin || supabase;
      await client.from("session").delete().eq("id", sessionId);
    } catch (restErr) {
      console.warn("invalidateSession REST error:", restErr);
    }
  }

  public createSessionCookie(
    sessionId: string,
    maxAgeSeconds = this.sessionDurationSeconds
  ): SessionCookie {
    return {
      name: Auth.sessionCookieName,
      value: sessionId,
      attributes: {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: maxAgeSeconds,
      },
    };
  }

  public clearSessionCookie(): SessionCookie {
    return {
      name: Auth.sessionCookieName,
      value: "",
      attributes: {
        expires: new Date(0),
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      },
    };
  }
}

export type AuthInstance = Auth;
