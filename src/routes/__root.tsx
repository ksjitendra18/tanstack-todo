// app/routes/__root.tsx
import type { ReactNode } from "react";
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "~/styles/app.css?url";
import { Navbar } from "~/components/navbar";
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { AUTH_COOKIES } from "~/constants/auth";
import { aesDecrypt } from "~/server/aes";
import { db } from "~/server/db";

const fetchAuth = createServerFn({ method: "GET" }).handler(async () => {
  const sessionToken = getCookie(AUTH_COOKIES.SESSION_TOKEN);

  if (!sessionToken) {
    return {
      isAuthenticated: false,
      user: null,
    };
  }

  const decryptedSessionToken = await aesDecrypt(sessionToken);

  const sessionData = await db.query.sessions.findFirst({
    where: {
      id: Number(decryptedSessionToken),
    },
  });

  if (!sessionData) {
    return {
      isAuthenticated: false,
      user: null,
    };
  }

  const user = await db.query.users.findFirst({
    where: {
      id: sessionData.userId,
    },
  });

  return {
    isAuthenticated: !!user,
    user,
  };
});

export const Route = createRootRoute({
  head: () => ({
    links: [{ rel: "stylesheet", href: appCss }],
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TanStack Start Starter",
      },
    ],
  }),
  component: RootComponent,
  beforeLoad: async () => {
    const { isAuthenticated, user } = await fetchAuth();
    return {
      isAuthenticated,
      user,
    };
  },
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  const { isAuthenticated } = Route.useRouteContext();
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        <Navbar isAuthenticated={isAuthenticated} />
        <main className="px-5 max-w-7xl mx-auto">{children}</main>
        <Scripts />
      </body>
    </html>
  );
}
