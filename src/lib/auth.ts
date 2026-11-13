import { sessionTable } from "@/db/schema/session";
import { userTable } from "@/db/schema/user";
import type { AstroCookieSetOptions } from "astro";
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

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
    }
    return Auth.instance;
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
    await this.db.insert(sessionTable).values(session);
    return session;
  }

  public async validateSession(
    sessionId: string
  ): Promise<{ session: Session | null; user: User | null }> {
    const now = Date.now();

    const sessionRows = await this.db
      .select()
      .from(sessionTable)
      .where(eq(sessionTable.id, sessionId));

    if (sessionRows.length === 0) return { session: null, user: null };

    const session: Session = {
      id: sessionRows[0].id,
      userId: sessionRows[0].userId,
      expiresAt: sessionRows[0].expiresAt,
    };

    if (now >= session.expiresAt.getTime()) {
      await this.db.delete(sessionTable).where(eq(sessionTable.id, session.id));
      return { session: null, user: null };
    }

    const halfLifeThreshold =
      session.expiresAt.getTime() - (this.sessionDurationSeconds * 1000) / 2;

    if (now >= halfLifeThreshold) {
      session.expiresAt = new Date(now + this.sessionDurationSeconds * 1000);
      await this.db
        .update(sessionTable)
        .set({ expiresAt: session.expiresAt })
        .where(eq(sessionTable.id, sessionId));
    }

    const [userData] = await this.db
      .select()
      .from(userTable)
      .where(eq(userTable.id, session.userId));

    if (!userData) return { session: null, user: null };

    const user: User = {
      id: userData.id,
      username: userData.username,
    };

    return { session, user };
  }

  public async invalidateSession(sessionId: string): Promise<void> {
    await this.db.delete(sessionTable).where(eq(sessionTable.id, sessionId));
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
