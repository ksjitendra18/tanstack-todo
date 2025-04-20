import { createMiddleware } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { getCookie } from "@tanstack/react-start/server";
import { AUTH_COOKIES } from "~/constants/auth";
import { aesDecrypt } from "./aes";
import { db } from "./db";

export const logMiddleware = createMiddleware().server(
  async ({ next, context, functionId }) => {
    const now = Date.now();

    const result = await next();

    const duration = Date.now() - now;
    console.log("Server Req/Res:", { duration: `${duration}ms`, functionId });

    return result;
  }
);

export const authenticatedMiddleware = createMiddleware()
  .middleware([logMiddleware])
  .server(async ({ next }) => {
    const authToken = getCookie(AUTH_COOKIES.SESSION_TOKEN);

    if (!authToken) {
      throw redirect({ to: "/login" });
    }

    const decryptedSessionId = await aesDecrypt(authToken);

    const sessionWithUser = await db.query.sessions.findFirst({
      where: {
        id: Number(decryptedSessionId),
      },
      with: {
        user: true,
      },
    });

    if (!sessionWithUser || !sessionWithUser.user) {
      throw redirect({ to: "/login" });
    }

    return next({
      context: { userId: sessionWithUser.user.id },
    });
  });
