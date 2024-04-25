"use client";

import { signup } from "@/app/signup/actions";
import { FormSchema } from "@/app/signup/schema";
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
import { getMessageFromCode } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";

export function SignupForm() {
	const router = useRouter();
	const [result, dispatch] = useFormState(signup, null);
	const { pending, data } = useFormStatus();
	const form = useForm(FormSchema);

	useEffect(() => {
		if (result) {
			if (result.type === "error") {
				toast.error(getMessageFromCode(result.resultCode));
			} else {
				toast.success(getMessageFromCode(result.resultCode));
				router.refresh();
			}
		}
	}, [result, router]);

	const formRef = useRef<HTMLFormElement>(null);

	return (
		<Form {...form}>
			<div className="flex flex-col items-center gap-4 space-y-3">
				<form
					ref={formRef}
					onSubmit={(evt) => {
						evt.preventDefault();
						form.handleSubmit(() => {
							dispatch(new FormData(formRef.current ?? undefined));
						})(evt);
					}}
					className="w-full flex-1 rounded-lg border bg-white px-6 pb-4 pt-8 shadow-md md:w-96 dark:bg-zinc-950"
				>
					{/* TODO: Typography component */}
					Sign up
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
					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Password</FormLabel>
								<FormControl>
									<Input
										placeholder="Enter Password"
										type="password"
										{...field}
									/>
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
					href="/login"
					className="flex flex-row gap-1 text-sm text-zinc-400"
				>
					Already have an account?{" "}
					<div className="font-semibold underline">Log in</div>
				</Link>
			</div>
		</Form>
	);
}
