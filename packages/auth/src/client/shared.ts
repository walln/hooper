import { session } from "../session";

export async function verifyToken(
	token: string,
): Promise<Awaited<ReturnType<typeof session.verify>>> {
	try {
		return await session.verify(token);
	} catch (e) {
		console.error(e);
		return {
			type: "public",
			properties: {},
		};
	}
}
