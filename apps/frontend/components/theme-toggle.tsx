"use client";

import { useTheme } from "next-themes";
import * as React from "react";

import { IconMoon, IconSun } from "@/components/ui/icons";
import { Button } from "@hooper/ui/button";

export function ThemeToggle() {
	const { setTheme, theme } = useTheme();
	const [_, startTransition] = React.useTransition();

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={() => {
				startTransition(() => {
					setTheme(theme === "light" ? "dark" : "light");
				});
			}}
		>
			{!theme ? null : theme === "dark" ? (
				<IconMoon className="transition-all" />
			) : (
				<IconSun className="transition-all" />
			)}
			<span className="sr-only">Toggle theme</span>
		</Button>
	);
}
