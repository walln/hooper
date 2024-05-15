"use server";

import { logger } from "@/lib/logger";
import { ResultCode, nanoid } from "@/lib/utils";
import { db } from "@hooper/db";
import { users } from "@hooper/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function getUser(email: string) {
	const user = await db
		.select()
		.from(users)
		.where(eq(users.email, email))
		.get();
	return user;
}

export async function createUser(email: string) {
	const existingUser = await getUser(email);

	if (existingUser) {
		return {
			type: "error",
			resultCode: ResultCode.UserAlreadyExists,
		};
	}

	const name = email.split("@")[0];
	if (!name) throw new Error("Invalid email");

	const user = await db.insert(users).values({
		id: nanoid(),
		email: email,
		name: name,
	});

	logger.info(`User created: ${user}`);

	return {
		type: "success",
		resultCode: ResultCode.UserCreated,
	};
}

export async function signout() {
	const cookieStore = cookies();
	cookieStore.delete("session");
	redirect("/");
}
