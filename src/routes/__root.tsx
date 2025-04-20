// app/routes/__root.tsx
import type { ReactNode } from "react";
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";

import appCss from "~/styles/app.css?url";
import { Navbar } from "~/components/navbar";
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { AUTH_COOKIES } from "~/constants/auth";
import { aesDecrypt } from "~/server/aes";
import { db } from "~/server/db";

import type { QueryClient } from "@tanstack/react-query";

const fetchAuth = createServerFn({ method: "GET" }).handler(async () => {
  console.log("-----------------------------------------------------");
  const now = performance.now();
  console.log("fetchAuth START");
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
    return {
      isAuthenticated: false,
      user: null,
    };
  }

  console.log("fetchAuth DONE WITH LATENCY", performance.now() - now);
  console.log("-----------------------------------------------------");

  return {
    isAuthenticated: !!sessionData.user,
    user: sessionData.user,
  };
});

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
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
        title: "TanStack Todos",
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
