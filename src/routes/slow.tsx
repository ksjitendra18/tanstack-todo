import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { and, eq } from "drizzle-orm";
import { useState } from "react";
import { BiCheck, BiPencil, BiTrash } from "react-icons/bi";
import { AUTH_COOKIES } from "~/constants/auth";
import { useMutation } from "~/hooks/use-mutation";
import { aesDecrypt } from "~/server/aes";
import { db } from "~/server/db";
import { todos } from "~/server/db/schema";
import { authenticatedMiddleware } from "~/server/middlewares";

export const Route = createFileRoute("/slow")({
  component: RouteComponent,
  loader: () => fetchTodos(),
  head: () => ({
    meta: [
      {
        title: "Slow Todos",
      },
    ],
  }),
  beforeLoad: async ({ context }) => {
    if (!context.isAuthenticated) {
      return redirect({
        href: "/login?next=/todos",
      });
    }
  },
});

const fetchTodos = createServerFn({ method: "GET" })
  .middleware([authenticatedMiddleware])
  .handler(async ({ context }) => {
    const todos = await db.query.todos.findMany({
      where: {
        userId: context.userId,
      },
    });

    return {
      error: false,
      todos: todos,
    };
  });

export const todoFn = createServerFn({ method: "POST" })
  .validator((d: { todo: string }) => d)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    await db.insert(todos).values({
      userId: context.userId,
      title: data.todo,
    });
  });

export const todoCompleteFn = createServerFn({ method: "POST" })
  .validator((d: { id: number }) => d)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    await db
      .update(todos)
      .set({
        isCompleted: true,
      })
      .where(
        and(eq(todos.id, Number(data.id)), eq(todos.userId, context.userId))
      );
  });

export const todoDeleteFn = createServerFn({ method: "POST" })
  .validator((d: { id: number }) => d)
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    await db
      .delete(todos)
      .where(
        and(eq(todos.id, Number(data.id)), eq(todos.userId, context.userId))
      );
  });

function RouteComponent() {
  const router = useRouter();

  const [add, setAdd] = useState(false);

  const todoMutation = useMutation({
    fn: useServerFn(todoFn),

    onSuccess: () => {
      router.invalidate();
    },
  });

  const todoCompleteMutation = useMutation({
    fn: useServerFn(todoCompleteFn),

    onSuccess: () => {
      router.invalidate();
    },
  });
  const todoDeleteMutation = useMutation({
    fn: useServerFn(todoDeleteFn),

    onSuccess: () => {
      router.invalidate();
    },
  });

  const { todos } = Route.useLoaderData();

  const completedTodos = todos?.filter((todo) => todo.isCompleted);

  const uncompletedTodos = todos?.filter((todo) => !todo.isCompleted);

  return (
    <div>
      <div className="flex gap-5 items-center">
        <h1 className="text-2xl font-bold">Slow Todos</h1>
        <button
          onClick={() => setAdd(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          Add Todo
        </button>
      </div>

      {add && (
        <div className="my-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              todoMutation.mutate({
                data: {
                  todo: formData.get("todo")! as string,
                },
              });
              setAdd(false);
            }}
          >
            <input
              className="px-2 py-2 rounded-md border-2 block w-full "
              type="text"
              name="todo"
              placeholder="Todo"
            />
            <button className="my-5 px-5 rounded-md bg-blue-600 py-2 disabled:bg-blue-600/30">
              Add
            </button>
          </form>
        </div>
      )}

      {uncompletedTodos && uncompletedTodos.length > 0 && (
        <div className="flex my-5 flex-col items-center gap-5">
          {uncompletedTodos.map((todo) => (
            <div
              key={todo.id}
              className="bg-blue-700 flex items-center justify-between w-full rounded-md px-7 py-2 ml-3 text-white"
            >
              <p>{todo.title}</p>

              <div className="flex gap-3 items-center">
                <button
                  onClick={() => {
                    todoCompleteMutation.mutate({
                      data: {
                        id: todo.id,
                      },
                    });
                  }}
                  className="cursor-pointer"
                >
                  <BiCheck size={35} />
                </button>
                <button
                  onClick={() => {
                    todoDeleteMutation.mutate({
                      data: {
                        id: todo.id,
                      },
                    });
                  }}
                  className="cursor-pointer"
                >
                  <BiTrash size={28} className="text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {completedTodos && completedTodos?.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mt-10 my-5">Completed</h2>
          <div className="flex my-5 flex-col items-center gap-5">
            {completedTodos.map((todo) => (
              <div
                key={todo.id}
                className="bg-blue-700 flex items-center justify-between w-full rounded-md px-7 py-2 ml-3 text-white"
              >
                <p>{todo.title}</p>

                <div className="flex gap-3 items-center">
                  <button
                    onClick={() => {
                      todoDeleteMutation.mutate({
                        data: {
                          id: todo.id,
                        },
                      });
                    }}
                    className="cursor-pointer"
                  >
                    <BiTrash size={28} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
