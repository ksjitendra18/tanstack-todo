// app/routes/__root.tsx
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Navbar } from "~/components/navbar";
import appCss from "~/styles/app.css?url";

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
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  // const { isAuthenticated } = Route.useRouteContext();
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        <Navbar isAuthenticated={false} />
        <main className="px-5">{children}</main>
        <Scripts />
      </body>
    </html>
  );
}
