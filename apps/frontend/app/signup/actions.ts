"use server";

import { FormSchema } from "@/app/signup/schema";
import { signIn } from "@/auth";
import { logger } from "@/lib/logger";
import { ResultCode, nanoid } from "@/lib/utils";
import { db } from "@hooper/db";
import { users } from "@hooper/db/schema";
import { getUser } from "../login/actions";

export async function createUser(email: string) {
	const existingUser = await getUser(email);

	if (existingUser) {
		return {
			type: "error",
			resultCode: ResultCode.UserAlreadyExists,
		};
	}

	const name = email.split("@")[0];

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

interface Result {
	type: string;
	resultCode: ResultCode;
}

export async function signup(
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

	//TODO: move to better provider
	if (parsed.success && parsed.data.password === "testing123") {
		try {
			const { email, password } = parsed.data;
			const result = await createUser(email);

			if (result.resultCode === ResultCode.UserCreated) {
				await signIn("credentials", {
					email,
					password,
					redirect: false,
				});
			}

			return result;
		} catch (error) {
			logger.error("Error signing up", { error });
			return {
				type: "error",
				resultCode: ResultCode.UnknownError,
			};
		}
	} else {
		return {
			type: "error",
			resultCode: ResultCode.InvalidCredentials,
		};
	}
}
