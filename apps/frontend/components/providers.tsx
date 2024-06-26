"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes/dist/types";
import * as React from "react";

import { SidebarProvider } from "@/lib/hooks/use-sidebar";
import { TooltipProvider } from "@hooper/ui/tooltip";

export function Providers({ children, ...props }: ThemeProviderProps) {
	return (
		<NextThemesProvider {...props}>
			<SidebarProvider>
				<TooltipProvider delayDuration={0}>{children}</TooltipProvider>
			</SidebarProvider>
		</NextThemesProvider>
	);
}
