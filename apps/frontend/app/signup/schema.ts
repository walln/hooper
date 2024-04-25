import { z } from "zod";

export const FormSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
});
