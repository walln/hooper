"use client";

import { CodeSchema } from "@/app/(auth)/login-code/schema";
import { IconSpinner } from "@/components/ui/icons";
import type { getAuthLinks } from "@/lib/auth";
import { useForm } from "@/lib/hooks/use-form";
import { Button } from "@hooper/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@hooper/ui/form";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from "@hooper/ui/input-otp";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { z } from "zod";

interface CodeSubmitProps
	extends Pick<ReturnType<typeof getAuthLinks>, "codeVerifyLink"> {
	error: string | undefined;
}

export function CodeSubmitForm(props: CodeSubmitProps) {
	const router = useRouter();
	const form = useForm(CodeSchema, {});
	const [loading, setLoading] = useState(false);
	const [initialErrorShown, setInitialErrorShown] = useState(false);

	useEffect(() => {
		if (props.error && !initialErrorShown) {
			form.setError("code", {
				type: "manual",
				message: props.error,
			});
			setInitialErrorShown(true);
		}
	});

	async function onSubmit(data: z.infer<typeof CodeSchema>) {
		setLoading(true);
		console.log(`${props.codeVerifyLink}?code=${data.code}`);
		router.push(`${props.codeVerifyLink}?code=${data.code}`);
		// setLoading(false);
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
						name="code"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Code</FormLabel>
								<FormControl>
									<InputOTP
										maxLength={6}
										{...field}
										render={({ slots }) => (
											<>
												<InputOTPGroup>
													{slots.slice(0, 3).map((slot, index) => (
														// biome-ignore lint/suspicious/noArrayIndexKey: this is fine
														<InputOTPSlot key={index} {...slot} />
													))}{" "}
												</InputOTPGroup>
												<InputOTPSeparator />
												<InputOTPGroup>
													{slots.slice(3).map((slot, index) => (
														// biome-ignore lint/suspicious/noArrayIndexKey: this is fine
														<InputOTPSlot key={index} {...slot} />
													))}
												</InputOTPGroup>
											</>
										)}
									/>
								</FormControl>
								<FormDescription>Enter your login code</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit" className="mt-2">
						{loading ? <IconSpinner /> : "Login"}
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
