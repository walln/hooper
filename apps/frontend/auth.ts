import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { object, string } from "zod";

export const signInSchema = object({
	email: string({ required_error: "Email is required" })
		.min(1, "Email is required")
		.email("Invalid email"),
	password: string({ required_error: "Password is required" })
		.min(1, "Password is required")
		.min(8, "Password must be more than 8 characters")
		.max(32, "Password must be less than 32 characters"),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
	providers: [
		Credentials({
			// You can specify which fields should be submitted, by adding keys to the `credentials` object.
			// e.g. domain, username, password, 2FA token, etc.
			credentials: {
				email: {},
				password: {},
			},
			authorize: async (credentials) => {
				let user = null;

				const { email, password } = await signInSchema.parseAsync(credentials);

				// logic to salt and hash password
				const pwHash = saltAndHashPassword(password);

				// logic to verify if user exists
				user = await getUserFromDb(email, pwHash);

				if (!user) {
					// No user found, so this is their first attempt to login
					// meaning this is also the place you could do registration
					throw new Error("User not found.");
				}

				// return user object with the their profile data
				return user;
			},
		}),
	],
});
