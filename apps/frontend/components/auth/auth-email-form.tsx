"use client";

import { AuthFormSchema } from "@/app/(auth)/schema";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import type { getAuthLinks } from "@/lib/auth";
import { useForm } from "@/lib/hooks/use-form";
import { Button } from "@hooper/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { z } from "zod";

interface AuthFormProps
	extends Pick<ReturnType<typeof getAuthLinks>, "codeAuthLink"> {}

export function AuthForm(props: AuthFormProps) {
	const router = useRouter();
	const form = useForm(AuthFormSchema);

	const [loading, setLoading] = useState(false);

	async function onSubmit(data: z.infer<typeof AuthFormSchema>) {
		setLoading(true);
		router.push(`${props.codeAuthLink}&email=${data.email}`);
		setLoading(false);
	}

	return (
		<Card className="w-full max-w-sm">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<CardHeader>
						<CardTitle className="text-2xl">Login</CardTitle>
						<CardDescription>
							Enter your email below to login to get started
						</CardDescription>
					</CardHeader>
					<CardContent>
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input placeholder="Enter Email" type="email" {...field} />
									</FormControl>
									<FormDescription>
										A login code will be sent to your email
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
					<CardFooter>
						<Button type="submit" className="w-full">
							{loading ? <IconSpinner /> : "Continue"}
						</Button>
					</CardFooter>
				</form>
			</Form>
		</Card>
	);
}
