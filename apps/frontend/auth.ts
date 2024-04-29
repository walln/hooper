import { db } from "@hooper/db";
import { users } from "@hooper/db/schema";
import { eq } from "drizzle-orm";
import NextAuth, { type Session, type User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { Resource } from "sst";
import { object, string } from "zod";
import { logger } from "./lib/logger";

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
	secret: Resource.AuthSecret.value,
	session: {
		strategy: "jwt",
	},
	providers: [
		Credentials({
			// You can specify which fields should be submitted, by adding keys to the `credentials` object.
			// e.g. domain, username, password, 2FA token, etc.
			credentials: {
				email: {},
				password: {},
			},
			authorize: async (credentials) => {
				const { email, password } = await signInSchema.parseAsync(credentials);

				const user = await db
					.select()
					.from(users)
					.where(eq(users.email, email))
					.get();

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
	callbacks: {
		async jwt({ token, user, account }) {
			return token;
		},
		async session({ session, token }) {
			if (token.sub && session?.user) {
				session.user.id = token.sub;
			}
			return {
				...session,
			};
		},
	},
});
