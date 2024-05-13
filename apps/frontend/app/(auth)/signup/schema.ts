import { z } from "zod";

export const FormSchema = z.object({
	email: z.string().email(),
});
