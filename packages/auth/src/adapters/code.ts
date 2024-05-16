import { sendAuthCode } from "@hooper/email/client";
import { Resource } from "sst";
import { CodeAdapter } from "sst/auth/adapter";
import { z } from "zod";
import { webUrl } from "../server";

const CodeAdapterClaimsSchema = z.object({
	email: z.string().min(1, "Email is required").email("Invalid email"),
});

export const codeAdapter = CodeAdapter({
	async onCodeRequest(code, unvalidatedClaims, _req) {
		const claims = CodeAdapterClaimsSchema.parse(unvalidatedClaims);

		// TODO: Check if OTP already exists for email
		console.log("code", code, claims);
		// console.log("req", req);

		const res = await sendAuthCode({
			email: claims.email,
			code,
			resendAPIKey: Resource.ResendApiKey.value,
		});

		console.log("Authenication email id:", res.emailId);

		return new Response("ok", {
			status: 302,
			headers: {
				Location: `${webUrl}/login-code?email=${claims.email}`,
			},
		});
	},
	async onCodeInvalid(_code, _claims, _req) {
		return new Response("failed", {
			status: 302,
			headers: {
				// TODO: handle error on page
				Location: `${webUrl}/login-code?error=invalid_code`,
			},
		});
	},
});
