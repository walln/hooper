import type { Message } from "ai";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const chats = sqliteTable("chat", {
	id: text("id").notNull().primaryKey().unique(),
	title: text("title").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	userId: text("id").notNull(),
	path: text("path").notNull(),
	messages: text("messages", { mode: "json" }).$type<Message[]>().notNull(),
	sharePath: text("share_path"),
});
