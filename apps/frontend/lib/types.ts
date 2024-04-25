import type { chats } from "@hooper/db/schema";

export type Chat = typeof chats.$inferSelect;

export type ServerActionResult<Result> = Promise<
	| Result
	| {
			error: string;
	  }
>;

export interface Session {
	user: {
		id: string;
		email: string;
	};
}

export interface AuthResult {
	type: string;
	message: string;
}

// biome-ignore lint/suspicious/noExplicitAny: Allow extra keys
export interface User extends Record<string, any> {
	id: string;
	email: string;
	password: string;
	salt: string;
}
