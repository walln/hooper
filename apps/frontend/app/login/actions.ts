"use server";

import { signIn } from "@/auth";
import { ResultCode } from "@/lib/utils";
import { db } from "@hooper/db";
import { users } from "@hooper/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { FormSchema } from "../signup/schema";

export async function getUser(email: string) {
	const user = await db
		.select()
		.from(users)
		.where(eq(users.email, email))
		.get();
	return user;
}

interface Result {
	type: string;
	resultCode: ResultCode;
}

export async function login(
	_prevState: Result | null,
	data: FormData,
): Promise<Result> {
	const parsed = FormSchema.safeParse(Object.fromEntries(data));
	if (!parsed.success) {
		return {
			type: "error",
			resultCode: ResultCode.InvalidSubmission,
		};
	}
	try {
		if (parsed.success) {
			const { email, password } = parsed.data;
			await signIn("credentials", {
				email,
				password,
				redirect: false,
			});

			return {
				type: "success",
				resultCode: ResultCode.UserLoggedIn,
			};
		}
		return {
			type: "error",
			resultCode: ResultCode.InvalidCredentials,
		};
	} catch (error) {
		return {
			type: "error",
			resultCode: ResultCode.UnknownError,
		};
	}
}
