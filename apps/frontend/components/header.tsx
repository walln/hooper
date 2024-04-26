import Link from "next/link";

import { auth } from "@/auth";
import { SignIn, SignOut } from "@/components/auth/auth-buttons";
import { ChatHistory } from "@/components/chat/chat-history";
import { SidebarMobile } from "@/components/chat/sidebar/sidebar-mobile";
import { SidebarToggle } from "@/components/chat/sidebar/sidebar-toggle";
import { Button } from "@/components/ui/button";
import {
	IconGitHub,
	IconHooper,
	IconNextChat,
	IconSeparator,
	IconSparkles,
} from "@/components/ui/icons";
import { UserMenu } from "@/components/user-menu";
import React from "react";

async function UserOrLogin() {
	const session = await auth();
	return (
		<>
			{session?.user ? (
				<>
					<SidebarMobile>
						<ChatHistory userId={session.user.id} />
					</SidebarMobile>
					<SidebarToggle />
				</>
			) : (
				<Link href="/new" rel="nofollow">
					<IconNextChat className="size-6 mr-2 dark:hidden" inverted />
					<IconNextChat className="hidden size-6 mr-2 dark:block" />
				</Link>
			)}
			<div className="flex items-center">
				<IconSeparator className="size-6 text-muted-foreground/50" />
				{session?.user ? (
					<UserMenu user={session.user} />
				) : (
					<Button variant="link" asChild className="-ml-2">
						<Link href="/login">Login</Link>
					</Button>
				)}
			</div>
		</>
	);
}

export async function Header() {
	const session = await auth();
	return (
		<header className="sticky top-0 z-50 flex items-center justify-between w-full px-4 border-b h-14 shrink-0 bg-background backdrop-blur-xl">
			<span className="inline-flex items-center home-links whitespace-nowrap">
				<a
					href="https://hooper.walln.dev"
					rel="noreferrer noopener"
					target="_blank"
				>
					<IconHooper className="w-5 h-5 sm:h-6 sm:w-6" />
				</a>
				<IconSeparator className="w-6 h-6 text-muted-foreground/20" />
				<Link href="/">
					<span className="text-lg font-bold">
						<IconSparkles className="inline mr-0 w-4 sm:w-5 mb-0.5" />
						AI
					</span>
				</Link>
			</span>
			<div className="flex items-center justify-end space-x-2">
				<React.Suspense fallback={<div className="flex-1 overflow-auto" />}>
					<UserOrLogin />
				</React.Suspense>

				{/* {session?.user ? <SignOut /> : <SignIn />} */}
				<Button variant="outline" asChild>
					<a
						target="_blank"
						href="https://github.com/walln/hooper"
						rel="noopener noreferrer"
					>
						<IconGitHub />
						<span className="hidden ml-2 md:flex">GitHub</span>
					</a>
				</Button>
			</div>
		</header>
	);
}
