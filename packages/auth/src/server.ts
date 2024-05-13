import { db, nanoid } from "@hooper/db";
import { users } from "@hooper/db/schema";
import { eq } from "drizzle-orm";
import { handle } from "hono/aws-lambda";
import { AuthHandler } from "sst/auth";
import { match } from "ts-pattern";
import { codeAdapter } from "./adapters/code";
import { session } from "./session";

const sessionExpiresIn = 30 * 24 * 60 * 60 * 1000;
export const webUrl = process.env.WEB_URL ?? "http://localhost:3000";

const app = AuthHandler({
	session: session,
	providers: {
		code: codeAdapter,
	},
	callbacks: {
		auth: {
			async error(error, req) {
				// TODO: Redirect to error on signin page
				return new Response("ok");
			},
			async allowClient(clientID, redirect, req) {
				console.log("allowClient", clientID, redirect);

				// TODO: Validate clientID and redirect
				return true;
			},
			async success(response, input, req) {
				console.log("success", response, input);

				const email = match(input.provider)
					.with("code", () => {
						const email = input.claims.email;
						return email;
					})
					.exhaustive();

				// Check if user exists with that email
				const user = await db
					.select()
					.from(users)
					.where(eq(users.email, email))
					.limit(1)
					.get();

				if (!user) {
					// Create user
					const id = nanoid();
					const name = email.split("@")[0];
					const rows = await db
						.insert(users)
						.values({ id, name, email })
						.returning();

					const createdUser = rows.at(0);

					if (!createdUser) {
						// TODO: Failure response
						throw new Error("Failed to create user");
					}

					return response.session({
						type: "user",
						expiresIn: sessionExpiresIn,
						properties: {
							userId: createdUser.id,
							email: createdUser.email,
						},
					});
				}

				console.log("User exists", user.id, user.email);
				console.log(
					"Session expiry datetime",
					new Date(Date.now() + sessionExpiresIn),
				);

				return response.session({
					type: "user",
					expiresIn: sessionExpiresIn,
					properties: {
						userId: user.id,
						email: user.email,
					},
				});
			},
		},
	},
});

export const handler = handle(app);
