import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";

export function SignIn() {
	return (
		<form
			action={async (formData) => {
				"use server";
				await signIn("credentials", formData);
			}}
		>
			<label>
				Email
				<input name="email" type="email" />
			</label>
			<label>
				Password
				<input name="password" type="password" />
			</label>
			<Button>Sign In</Button>
		</form>
	);
}
