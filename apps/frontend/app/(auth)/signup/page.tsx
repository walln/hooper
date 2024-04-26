import { auth } from "@/auth";
import { SignupForm } from "@/components/auth/signup-form";
import type { Session } from "@/lib/types";
import { redirect } from "next/navigation";

export default async function SignupPage() {
	const session = (await auth()) as Session;

	if (session) {
		redirect("/");
	}

	return (
		<main className="flex flex-col p-4">
			<SignupForm />
		</main>
	);
}
