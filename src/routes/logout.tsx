import { createFileRoute, redirect } from "@tanstack/react-router";
import { deleteCookie, getCookie } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { AUTH_COOKIES } from "~/constants/auth";
import { aesDecrypt } from "~/server/aes";
import { db } from "~/server/db";
import { sessions } from "~/server/db/schema";

export const logoutFn = async () => {
  const sessionToken = getCookie(AUTH_COOKIES.SESSION_TOKEN);
  console.log("session", sessionToken);

  if (sessionToken) {
    const decryptedSessionToken = await aesDecrypt(sessionToken);

    await db
      .delete(sessions)
      .where(eq(sessions.id, Number(decryptedSessionToken)));

    deleteCookie(AUTH_COOKIES.SESSION_TOKEN);
  }

  throw redirect({
    href: "/",
  });
};

export const Route = createFileRoute("/logout")({
  preload: false,
  loader: () => logoutFn,
});
