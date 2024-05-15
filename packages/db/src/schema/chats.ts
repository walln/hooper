import type { CoreMessage } from "ai";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";
import { users } from "./user";

export type Message = CoreMessage & {
	id: string;
};

export const chats = sqliteTable("chat", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid()),
	title: text("title").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	userId: text("userId").references(() => users.id),
	path: text("path").notNull(),
	messages: text("messages", { mode: "json" }).$type<Message[]>().notNull(),
	sharePath: text("share_path"),
});
