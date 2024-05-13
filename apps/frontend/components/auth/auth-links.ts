import { headers } from "next/headers";

export function getAuthLinks() {
	const siteUrl = headers().get("x-host-url") || "http://localhost:3000";

	// const authUrl = Resource.AuthURL.value;

	const params = new URLSearchParams({
		client_id: "web",
		redirect_uri: `${siteUrl}/api/auth-callback`,
		response_type: "code",
	});

	const codeAuthLink = `${
		process.env.AUTH_URL
	}/code/authorize?${params.toString()}`;

	const codeVerifyLink = `${process.env.AUTH_URL}/code/callback`;

	return {
		codeAuthLink,
		codeVerifyLink,
	};
}
