import "./globals.css";

import { Header } from "@/components/header";
import { Providers } from "@/components/providers";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: {
		default: "Hooper AI Chatbot",
		template: "%s - Hooper AI Chatbot",
	},
	description: "An AI powered chatbot for hoops fans.",
	icons: {
		icon: "/favicon.ico",
	},
};

export const viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "white" },
		{ media: "(prefers-color-scheme: dark)", color: "black" },
	],
};

interface RootLayoutProps {
	children: React.ReactNode;
}
export default function RootLayout({ children }: RootLayoutProps) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={cn(
					// "font-sans antialiased",
					GeistSans.variable,
					GeistMono.variable,
				)}
			>
				<Toaster position="top-center" />
				<Providers
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<div className="flex flex-col min-h-screen">
						<Header />
						<main className="flex flex-col flex-1 bg-muted/50 -mb-1">
							{children}
						</main>
					</div>
					<TailwindIndicator />
				</Providers>
			</body>
		</html>
	);
}
