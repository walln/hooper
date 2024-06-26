import { db, nanoid } from "@hooper/db";
import { users } from "@hooper/db/schema";
import { eq } from "drizzle-orm";
import { handle } from "hono/aws-lambda";
import { AuthHandler } from "sst/auth";
import { match } from "ts-pattern";
import { codeAdapter } from "./adapters/code";
import { session } from "./session";

const sessionExpiresIn = 30 * 24 * 60 * 60 * 1000;
// biome-ignore lint/complexity/useLiteralKeys: type error
export const webUrl = process.env["WEB_URL"] ?? "http://localhost:3000";

const app = AuthHandler({
	session: session,
	providers: {
		code: codeAdapter,
	},
	callbacks: {
		auth: {
			async error(error, _req) {
				// TODO: Redirect to error on signin page
				return new Response("ok", {
					status: 302,
					headers: {
						Location: `${webUrl}/login-code?error=${error.message}`,
					},
				});
			},
			async allowClient(clientID, _redirect, _req) {
				// TODO: Validate clientID and redirect better
				if (clientID !== "web") return false;
				return true;
			},
			async success(response, input, _req) {
				console.log("success", response, input);

				const email = match(input.provider)
					.with("code", () => {
						// biome-ignore lint/complexity/useLiteralKeys: type error
						const email = input.claims["email"];
						return email;
					})
					.exhaustive();

				if (!email) throw new Error("Email not found");

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
					if (!name) throw new Error("Invalid email");

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
