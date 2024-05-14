import { AuthForm } from "@/components/auth/auth-email-form";
import { getAuthLinks } from "@/lib/auth";
import { auth } from "@hooper/auth/next-client";
import { redirect } from "next/navigation";

export default async function LoginPage() {
	const session = await auth();

	const authLinks = getAuthLinks();

	if (session.type === "user") {
		redirect("/");
	}

	return (
		<main className="flex flex-col p-4 flex-grow justify-center items-center">
			<AuthForm codeAuthLink={authLinks.codeAuthLink} />
		</main>
	);
}
