import { getAuthLinks } from "@/components/auth/auth-links";
import { CodeSubmitForm } from "@/components/auth/code-submit-form";
import { auth } from "@hooper/auth/next-client";
import { redirect } from "next/navigation";

export default async function LoginCodePage({
	searchParams,
}: {
	searchParams: {
		error?: string;
	};
}) {
	const session = await auth();

	const authLinks = getAuthLinks();

	if (session.type === "user") {
		redirect("/");
	}

	return (
		<main className="flex flex-col p-4">
			<CodeSubmitForm
				codeVerifyLink={authLinks.codeVerifyLink}
				error={searchParams.error}
			/>
		</main>
	);
}
