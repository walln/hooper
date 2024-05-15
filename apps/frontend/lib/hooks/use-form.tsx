import { zodResolver } from "@hookform/resolvers/zod";
import { useForm as useRHForm } from "react-hook-form";
import type { UseFormProps } from "react-hook-form";
import type { ZodType, z } from "zod";

// biome-ignore lint/suspicious/noExplicitAny: Generic type magic
export function useForm<T extends ZodType<any, any, any>, TContext = any>(
	schema: T,
	props?: Partial<UseFormProps<T, TContext>>,
) {
	return useRHForm<z.infer<T>, TContext>({
		resolver: zodResolver(schema),
		...props,
	});
}
