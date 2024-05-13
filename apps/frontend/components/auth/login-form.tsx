"use client";

import { FormSchema } from "@/app/(auth)/signup/schema";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { IconSpinner } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { useForm } from "@/lib/hooks/use-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import type { z } from "zod";
import type { getAuthLinks } from "./auth-links";

interface LoginFormProps
	extends Pick<ReturnType<typeof getAuthLinks>, "codeAuthLink"> {}

export function LoginForm(props: LoginFormProps) {
	const router = useRouter();
	const { pending } = useFormStatus();
	const form = useForm(FormSchema);

	async function onSubmit(data: z.infer<typeof FormSchema>) {
		router.push(`${props.codeAuthLink}&email=${data.email}`);
	}

	return (
		<Form {...form}>
			<div className="flex flex-col items-center gap-4 space-y-3">
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="w-full flex-1 rounded-lg border bg-white px-6 pb-4 pt-8 shadow-md md:w-96 dark:bg-zinc-950"
				>
					{/* TODO: Typography component */}
					Login
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input placeholder="Enter Email" type="email" {...field} />
								</FormControl>
								<FormDescription>Enter your email address</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit" className="mt-2">
						{pending ? <IconSpinner /> : "Create account"}
					</Button>
				</form>
				<Link
					href="/signup"
					className="flex flex-row gap-1 text-sm text-zinc-400"
				>
					No account yet? <div className="font-semibold underline">Sign up</div>
				</Link>
			</div>
		</Form>
	);
}
