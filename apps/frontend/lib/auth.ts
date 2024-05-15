import { Resource } from "sst";

// biome-ignore lint/complexity/useLiteralKeys: type error
export const siteUrl = process.env["WEB_URL"];

export function getAuthLinks() {
	const params = new URLSearchParams({
		client_id: "web",
		redirect_uri: `${siteUrl}/api/auth/tokens`,
		response_type: "code",
	});

	console.log("siteUrl", siteUrl);
	console.log("Redirect URI", params.get("redirect_uri"));

	const codeAuthLink = `${
		Resource.AuthAuthenticator.url
	}code/authorize?${params.toString()}`;

	const codeVerifyLink = `${Resource.AuthAuthenticator.url}code/callback`;

	return {
		codeAuthLink,
		codeVerifyLink,
	};
}
