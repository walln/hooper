import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function SignOut(props: React.ComponentPropsWithRef<typeof Button>) {
	return (
		<form
			action={async () => {
				"use server";
				await signOut({ redirectTo: "/" });
			}}
			className="w-full"
		>
			<Button variant="secondary" {...props}>
				Sign Out
			</Button>
		</form>
	);
}

export function SignIn() {
	return (
		<Link href="/login">
			<Button variant="secondary">Login</Button>
		</Link>
	);
}
