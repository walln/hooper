import { getAuthLinks } from "@/components/auth/auth-links";
import { LoginForm } from "@/components/auth/login-form";
import { auth } from "@hooper/auth/next-client";
import { redirect } from "next/navigation";

export default async function LoginPage() {
	const session = await auth();

	const authLinks = getAuthLinks();

	if (session.type === "user") {
		redirect("/");
	}

	return (
		<main className="flex flex-col p-4">
			<LoginForm codeAuthLink={authLinks.codeAuthLink} />
		</main>
	);
}
