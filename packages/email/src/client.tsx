import * as React from "react";
import { Resend } from "resend";
import { AuthenticationCodeEmail } from "../emails/auth-code";

// biome-ignore lint/complexity/useLiteralKeys: type error
const shouldSendEmails = process.env["DEVELOPMENT_EMAILS"] === "true";

export async function sendAuthCode({
	email,
	code,
	resendAPIKey,
}: { email: string; code: string; resendAPIKey: string }) {
	console.log(
		"Should send emails",
		shouldSendEmails,
		// biome-ignore lint/complexity/useLiteralKeys: type error
		process.env["DEVELOPMENT_EMAILS"],
	);

	const resend = new Resend(resendAPIKey);

	const res = await resend.emails.send({
		from: "noreply@hooper.walln.dev",
		to: shouldSendEmails ? email : "delivered@resend.dev",
		subject: "Your Hooper verification code",
		react: <AuthenticationCodeEmail code={code} />,
	});

	if (res.error || !res.data) {
		console.error(res.error);
		throw new Error(res?.error?.message ?? "Email sending failed");
	}

	console.log("Email sent:", res.data.id);
	return { emailId: res.data.id };
}
