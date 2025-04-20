import {
  queryOptions,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { Suspense, useState } from "react";
import { BiCheck, BiTrash } from "react-icons/bi";
import { useMutation } from "~/hooks/use-mutation";
import { db } from "~/server/db";
import { todos } from "~/server/db/schema";
import { authenticatedMiddleware, logMiddleware } from "~/server/middlewares";

const todosQueryOptions = () =>
  queryOptions({
    queryKey: ["todos"],
    queryFn: () => fetchTodos(),
  });
export const Route = createFileRoute("/todo")({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: "Todos",
      },
    ],
  }),
  loader: async ({ context }) => {
    context.queryClient.ensureQueryData(todosQueryOptions());
  },
});

const fetchTodos = createServerFn({ method: "GET" })
  .middleware([authenticatedMiddleware])
  .handler(async ({ context, data }) => {
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
  .middleware([logMiddleware, authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    await db.insert(todos).values({
      userId: context.userId,
      title: data.todo,
    });
  });

export const todoCompleteFn = createServerFn({ method: "POST" })
  .validator((d: { id: number }) => d)
  .middleware([logMiddleware, authenticatedMiddleware])
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
  .middleware([logMiddleware, authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    await db
      .delete(todos)
      .where(
        and(eq(todos.id, Number(data.id)), eq(todos.userId, context.userId))
      );
  });

function Todos() {
  const router = useRouter();

  // const { data } = useSuspenseQuery({

  //   queryKey: ["todos"],
  //   queryFn: () => fetchTodos(),
  // });

  const { data } = useSuspenseQuery(todosQueryOptions());

  const queryClient = useQueryClient();

  const completedTodos = data?.todos?.filter((todo) => todo.isCompleted);

  const uncompletedTodos = data?.todos?.filter((todo) => !todo.isCompleted);

  const todoCompleteMutation = useMutation({
    fn: useServerFn(todoCompleteFn),

    onSuccess: () => {
      router.invalidate();
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
  const todoDeleteMutation = useMutation({
    fn: useServerFn(todoDeleteFn),

    onSuccess: () => {
      router.invalidate();
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  return (
    <>
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
    </>
  );
}

function RouteComponent() {
  const router = useRouter();

  const [add, setAdd] = useState(false);

  const queryClient = useQueryClient();
  const todoMutation = useMutation({
    fn: useServerFn(todoFn),

    onSuccess: () => {
      router.invalidate();
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  return (
    <div>
      <div className="flex gap-5 items-center">
        <h1 className="text-2xl font-bold">Stream Todos</h1>
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

      <Suspense fallback={<div>Loading...</div>}>
        <Todos />
      </Suspense>
    </div>
  );
}
