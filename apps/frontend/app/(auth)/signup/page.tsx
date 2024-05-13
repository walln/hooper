import { SignupForm } from "@/components/auth/signup-form";
import { auth } from "@hooper/auth/next-client";
import { redirect } from "next/navigation";

export default async function SignupPage() {
	const session = await auth();

	if (session.type === "user") {
		redirect("/");
	}

	return (
		<main className="flex flex-col p-4">
			<SignupForm />
		</main>
	);
}
