import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  users: {
    todos: r.many.todos(),
    sessions: r.many.sessions(),
  },
  sessions: {
    user: r.one.users({
      from: r.sessions.userId,
      to: r.users.id,
    }),
  },
  todos: {
    user: r.one.users({
      from: r.todos.userId,
      to: r.users.id,
    }),
  },
}));
