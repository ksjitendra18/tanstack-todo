import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { deleteCookie, getCookie } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { AUTH_COOKIES } from "~/constants/auth";
import { aesDecrypt } from "~/server/aes";
import { db } from "~/server/db";
import { sessions } from "~/server/db/schema";

export const logoutFn = createServerFn().handler(async () => {
  const sessionToken = getCookie(AUTH_COOKIES.SESSION_TOKEN);

  if (sessionToken) {
    const decryptedSessionToken = await aesDecrypt(sessionToken);

    await db
      .delete(sessions)
      .where(eq(sessions.id, Number(decryptedSessionToken)));

    await deleteCookie(AUTH_COOKIES.SESSION_TOKEN, {
      path: "/",
    });
  }

  throw redirect({
    href: "/",
  });
});

export const Route = createFileRoute("/logout")({
  preload: false,
  loader: () => logoutFn(),
});
