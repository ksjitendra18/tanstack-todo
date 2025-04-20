import { getCookie } from "@tanstack/react-start/server";
import { AUTH_COOKIES } from "~/constants/auth";
import { aesDecrypt } from "~/server/aes";
import { db } from "~/server/db";

export const getCurrentUser = async () => {
  const sessionToken = await getCookie(AUTH_COOKIES.SESSION_TOKEN);

  if (!sessionToken) {
    return null;
  }

  const decryptedSessionToken = await aesDecrypt(sessionToken);

  const sessionData = await db.query.sessions.findFirst({
    where: {
      id: Number(decryptedSessionToken),
    },
    columns: {},
    with: {
      user: {
        columns: {
          id: true,
        },
      },
    },
  });

  if (!sessionData || !sessionData.user) {
    return null;
  }

  return { user: sessionData.user };
};
