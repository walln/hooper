import { ExternalLink } from "@/components/external-link";

export function EmptyScreen() {
	return (
		<div className="mx-auto max-w-2xl px-4">
			<div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
				<h1 className="text-lg font-semibold">Welcome to Hooper!</h1>
				<p className="leading-normal text-muted-foreground">
					Hooper is an AI chatbot that knows all about what's happening in the{" "}
					<ExternalLink href="https://www.nba.com">NBA</ExternalLink>. Ask it
					Ask it anything about the NBA, and it will do its best to answer using
					custom LLMs trained to talk hoops.
				</p>
				<p className="leading-normal text-muted-foreground">
					Hooper has up to date information on the NBA, including player stats,
					team standings, and game schedules. It can also provide analysis and
					predictions on games and players. Hooper also knows about current NBA
					events and news.
				</p>
			</div>
		</div>
	);
}
