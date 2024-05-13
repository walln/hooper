import { headers } from "next/headers";
import { Resource } from "sst";

export function getAuthLinks() {
	const siteUrl = headers().get("x-host-url") || "http://localhost:3000";

	const params = new URLSearchParams({
		client_id: "web",
		redirect_uri: `${siteUrl}/api/auth-callback`,
		response_type: "code",
	});

	const codeAuthLink = `${
		Resource.AuthAuthenticator.url
	}/code/authorize?${params.toString()}`;

	const codeVerifyLink = `${Resource.AuthAuthenticator.url}/code/callback`;

	return {
		codeAuthLink,
		codeVerifyLink,
	};
}
