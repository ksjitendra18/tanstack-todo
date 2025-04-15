import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { nanoid } from "nanoid";
import { useMutation } from "~/hooks/use-mutation";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { hashPassword } from "~/server/hash";

export const Route = createFileRoute("/signup")({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    if (context.isAuthenticated) {
      return redirect({
        href: "/todos",
      });
    }
  },
});

export const signupFn = createServerFn({ method: "POST" })
  .validator(
    (d: { email: string; password: string; redirectUrl?: string }) => d
  )
  .handler(async ({ data }) => {
    const userExists = await db.query.users.findFirst({
      where: {
        email: data.email,
      },
    });

    if (userExists) {
      return {
        error: true,
        userExists: true,
        message: "User already exists",
      };
    }

    const salt = nanoid(64);
    console.log("salt", salt);
    const hashedPassword = await hashPassword({
      password: data.password,
      salt: salt,
    });
    await db.insert(users).values({
      email: data.email,
      hashedPassword: hashedPassword,
      passwordSalt: salt,
    });

    throw redirect({
      href: data.redirectUrl || "/",
    });
  });

function RouteComponent() {
  const signupMutation = useMutation({
    fn: useServerFn(signupFn),
  });

  const isLoading = signupMutation.status === "pending";
  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          signupMutation.mutate({
            data: {
              email: formData.get("email")! as string,
              password: formData.get("password")! as string,
            },
          });
        }}
        className="border-2 max-w-xl mx-auto px-5 py-2 rounded-md"
      >
        <h1 className="text-2xl font-bold text-center my-5">Signup</h1>
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
          className="my-5 w-full rounded-md bg-blue-600 py-2"
          type="submit"
        >
          {isLoading ? "Signup..." : "Signup"}
        </button>

        {signupMutation.status === "success" && signupMutation.data?.error && (
          <div className="bg-red-600 px-2 py-1 rounded-md">
            {signupMutation.data?.message}
          </div>
        )}

        <p className="text-center my-5">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
