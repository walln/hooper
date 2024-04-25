import { zodResolver } from "@hookform/resolvers/zod";
import { useForm as useRHForm } from "react-hook-form";
import type { ZodType, z } from "zod";

// biome-ignore lint/suspicious/noExplicitAny: Generic type magic
export function useForm<T extends ZodType<any, any, any>>(
	schema: T,
	defaults?: z.infer<T>,
) {
	return useRHForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: defaults,
	});
}
