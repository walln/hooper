"use client";

import { Sidebar } from "@/components/chat/sidebar/sidebar";
import { IconSidebar } from "@/components/ui/icons";
import { Button } from "@hooper/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@hooper/ui/sheet";

interface SidebarMobileProps {
	children: React.ReactNode;
}

export function SidebarMobile({ children }: SidebarMobileProps) {
	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button variant="ghost" className="-ml-2 flex size-9 p-0 lg:hidden">
					<IconSidebar className="size-6" />
					<span className="sr-only">Toggle Sidebar</span>
				</Button>
			</SheetTrigger>
			<SheetContent
				side="left"
				className="inset-y-0 flex h-auto w-[300px] flex-col p-0"
			>
				<Sidebar className="flex">{children}</Sidebar>
			</SheetContent>
		</Sheet>
	);
}
