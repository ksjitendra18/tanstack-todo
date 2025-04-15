import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { setCookie } from "@tanstack/react-start/server";
import { AUTH_COOKIES } from "~/constants/auth";
import { useMutation } from "~/hooks/use-mutation";
import { aesEncrypt } from "~/server/aes";
import { db } from "~/server/db";
import { sessions } from "~/server/db/schema";
import { hashPassword, verifyPassword } from "~/server/hash";

import { BiLoaderAlt } from "react-icons/bi";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    if (context.isAuthenticated) {
      return redirect({
        href: "/todos",
      });
    }
  },
});

export const loginFn = createServerFn({ method: "POST" })
  .validator(
    (d: { email: string; password: string; redirectUrl?: string }) => d
  )
  .handler(async ({ data }) => {
    const userExists = await db.query.users.findFirst({
      where: {
        email: data.email,
      },
    });

    if (!userExists) {
      return {
        error: true,
        userExists: false,
        message: "User doesn't exists",
      };
    }

    const passwordMatched = await verifyPassword({
      password: data.password,
      hashedPassword: userExists.hashedPassword,
      salt: userExists.passwordSalt,
    });

    if (!passwordMatched) {
      return {
        error: true,
        userExists: false,
        message: "Password doesn't match",
      };
    }

    const [newSession] = await db
      .insert(sessions)
      .values({
        userId: userExists.id,
        expiresAt: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 30),
      })
      .returning({ id: sessions.id });

    const encryptedSessionId = await aesEncrypt(String(newSession.id));

    setCookie(AUTH_COOKIES.SESSION_TOKEN, encryptedSessionId, {
      httpOnly: true,
      secure: false,
      expires: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 30),
    });
    throw redirect({
      href: data.redirectUrl || "/",
    });
  });

function RouteComponent() {
  const loginMutation = useMutation({
    fn: useServerFn(loginFn),
  });

  console.log("loginMutation", loginMutation);

  const isLoading = loginMutation.status === "pending";

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          loginMutation.mutate({
            data: {
              email: formData.get("email")! as string,
              password: formData.get("password")! as string,
            },
          });
        }}
        className="border-2 max-w-xl mx-auto px-5 py-2 rounded-md"
      >
        <h1 className="text-2xl font-bold text-center my-5">Login</h1>
        <input
          className="px-2 py-2 rounded-md border-2 block w-full"
          type="text"
          name="email"
          placeholder="Email"
        />
        <input
          className="px-2 my-3 py-2 rounded-md border-2 block w-full"
          type="password"
          name="password"
          placeholder="Password"
        />
        <button
          disabled={isLoading}
          className="my-5 w-full rounded-md bg-blue-600 py-2 disabled:bg-blue-600/30"
          type="submit"
        >
          {isLoading ? (
            <BiLoaderAlt className="animate-spin mx-auto" />
          ) : (
            "Login"
          )}
        </button>

        {loginMutation.status === "success" && loginMutation.data?.error && (
          <div className="bg-red-600 px-2 py-1 rounded-md">
            {loginMutation.data?.message}
          </div>
        )}

        <p className="text-center my-5">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
