import { cookies } from "next/headers";
import { cache } from "react";
import type { session } from "../session";
import { verifyToken } from "./shared";

export async function uncachedAuth(): Promise<
	Awaited<ReturnType<typeof session.verify>>
> {
	const cookieStore = cookies();
	const token = cookieStore.get("session")?.value;
	if (!token) return { type: "public", properties: {} };

	return await verifyToken(token);
}

export const auth = cache(uncachedAuth);
