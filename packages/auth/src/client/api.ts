import { verifyToken } from "./shared";

export const auth = async (token: string) => {
	return await verifyToken(token);
};
