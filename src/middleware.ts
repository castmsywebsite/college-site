import { defineMiddleware } from "astro:middleware";
import { Auth } from "./lib/auth";
import { db } from "./db";

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.db = db;
  context.locals.auth = Auth.getInstance(context.locals.db);
  const auth = context.locals.auth;

  const sessionId = context.cookies.get(Auth.sessionCookieName)?.value;
  if (!sessionId) {
    console.log("no session id");
    context.locals.user = null;
    context.locals.session = null;
    return next();
  }
  const { session, user } = await auth.validateSession(sessionId);

  // Set cookies BEFORE calling next()
  if (session) {
    const sessionCookie = auth.createSessionCookie(session.id);
    context.cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );
  } else {
    console.log("no session");
    const sessionCookie = auth.clearSessionCookie();
    context.cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );
  }

  context.locals.session = session;
  context.locals.user = user;
  console.log(user);
  return next();
});
