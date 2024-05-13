import { cookies, headers } from "next/headers";
import { Resource } from "sst";

export async function GET(request: Request) {
	// Get token and state from search params
	const searchParams = new URLSearchParams(request.url.split("?")[1]);

	const code = searchParams.get("code");
	const state = searchParams.get("state");

	if (!code || state !== "") {
		return new Response("Invalid callback", {
			status: 302,
			headers: {
				Location: "/login-code?error=invalid_callback",
			},
		});
	}

	// Now get the token from the code
	const siteUrl = headers().get("x-host-url") || "http://localhost:3000";

	const formData = new FormData();
	formData.append("grant_type", "authorization_code");
	formData.append("client_id", "web");
	formData.append("code", code);
	formData.append("redirect_uri", new URL("/api/auth-callback", siteUrl).href);

	const response = await fetch(`${Resource.AuthAuthenticator.url}/token`, {
		method: "POST",
		body: formData,
	});

	if (!response.ok) {
		const errorText = await response.text();
		console.error("Error Response:", errorText);
		throw new Error("Non-OK HTTP status code");
	}

	const data = await response.json();
	const token = data.access_token;

	const cookieStore = cookies();

	cookieStore.set("session", token, {
		httpOnly: false,
		maxAge: 2592000,
	});

	return new Response("ok", {
		status: 302,
		headers: {
			Location: "/",
		},
	});
}
