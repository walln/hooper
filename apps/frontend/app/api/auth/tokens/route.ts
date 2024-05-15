import { siteUrl } from "@/lib/auth";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { Resource } from "sst";

const HOURS = 60 * 60;

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	console.log("In route handler");

	try {
		console.log("GET /api/auth/tokens");

		// Get code from request
		const { searchParams } = new URL(request.url);
		const code = searchParams.get("code");

		if (!code) {
			throw new Error("No code provided");
		}

		// Now get the token from the code
		const formData = new FormData();
		formData.append("grant_type", "authorization_code");
		formData.append("client_id", "web");
		formData.append("code", code);
		formData.append("redirect_uri", new URL("/api/auth/tokens", siteUrl).href);

		const response = await fetch(`${Resource.AuthAuthenticator.url}token`, {
			method: "POST",
			body: formData,
			cache: "no-store",
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
			maxAge: 30 * 24 * HOURS,
			path: "/",
		});

		return NextResponse.redirect(new URL("/", siteUrl));
	} catch (error) {
		console.error("Error:", error);
		let errorMessage = "auth_error";
		if (error instanceof Error) {
			console.error("Error message:", error.message);
			errorMessage = error.message;
		}
		return NextResponse.redirect(
			new URL(`/login-code?error=${encodeURIComponent(errorMessage)}`, siteUrl),
		);
	}
}
