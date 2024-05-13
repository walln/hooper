import { z } from "zod";

export const CodeSchema = z.object({
	code: z.string().min(6, "Code must be 6 characters"),
});
