import { cn } from "@/lib/utils";

export function FooterText({ className, ...props }: React.ComponentProps<"p">) {
	return (
		<p
			className={cn(
				"px-2 text-center text-xs leading-normal text-muted-foreground",
				className,
			)}
			{...props}
		>
			Hooper is a chatbot - don't get too upset if it doesn't share your
			opinions. (Talking to you Lakers fans)
		</p>
	);
}
