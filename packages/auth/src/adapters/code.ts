import { CodeAdapter } from "sst/auth/adapter";
import { z } from "zod";
import { webUrl } from "../server";

const CodeAdapterClaimsSchema = z.object({
	email: z.string().min(1, "Email is required").email("Invalid email"),
});

export const codeAdapter = CodeAdapter({
	async onCodeRequest(code, unvalidatedClaims, req) {
		const claims = CodeAdapterClaimsSchema.parse(unvalidatedClaims);

		// TODO: Check if OTP already exists for email
		console.log("code", code, claims);
		// console.log("req", req);

		return new Response("ok", {
			status: 302,
			headers: {
				Location: `${webUrl}/login-code?email=${claims.email}`,
			},
		});
	},
	async onCodeInvalid(code, claims, req) {
		return new Response("failed", {
			status: 302,
			headers: {
				// TODO: handle error on page
				Location: `${webUrl}/login-code?error=invalid_code`,
			},
		});
	},
});
