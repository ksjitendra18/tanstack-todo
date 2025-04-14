import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
  email: text().notNull().unique(),
  hashedPassword: text().notNull(),
  passwordSalt: text().notNull(),
  createdAt: integer({ mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer({ mode: "timestamp" }).$onUpdate(() => sql`(unixepoch())`),
});

export const sessions = sqliteTable("sessions", {
  id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer({ mode: "number" }).notNull(),
  expiresAt: integer({ mode: "timestamp" }).notNull(),
  createdAt: integer({ mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const todos = sqliteTable(
  "todos",
  {
    id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    title: text().notNull(),
    description: text(),
    isCompleted: integer({ mode: "boolean" }).default(false).notNull(),
    userId: integer({ mode: "number" })
      .references(() => users.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      })
      .notNull(),
    createdAt: integer({ mode: "timestamp" }).default(sql`(unixepoch())`),
    updatedAt: integer({ mode: "timestamp" }).$onUpdate(
      () => sql`(unixepoch())`
    ),
  },
  (t) => [index("todos_user_id_index").on(t.userId)]
);
