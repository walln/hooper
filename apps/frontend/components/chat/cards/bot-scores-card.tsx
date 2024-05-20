"use client";

import { cn } from "@/lib/utils";
import type { NBAScoresSchema } from "@hooper/core/espn";
import { ScrollArea, ScrollBar } from "@hooper/ui/scroll-area";
import Image from "next/image";
import type { z } from "zod";

type ScoresResponse = z.infer<typeof NBAScoresSchema>;

export function ScoresSkeleton() {
	return (
		<ScrollArea>
			<div className="flex flex-col pb-4 h-1/2 space-y-2">
				{[...Array(3)].map((val, _) => (
					<div
						key={val}
						className="w-full h-[100px] bg-gray-300 animate-pulse rounded-md"
					/>
				))}
			</div>
			<ScrollBar orientation="vertical" />
		</ScrollArea>
	);
}
function TeamLogo({
	aspectRatio = "square",
	logo,
}: { aspectRatio?: "portrait" | "square"; logo: string }) {
	return (
		<Image
			src={logo}
			alt="Team logo"
			width={50}
			height={50}
			className={cn(
				"h-auto w-auto object-cover transition-all hover:scale-105 md:scale-100 scale-50",
				aspectRatio === "portrait" ? "aspect-[3/4]" : "aspect-square",
			)}
			loading="eager"
		/>
	);
}

function TeamCard({
	team,
}: {
	team: ScoresResponse["events"][number]["competitions"][number]["competitors"][number];
	aspectRatio?: "portrait" | "square";
}) {
	return (
		<div className="flex flex-col md:flex-row">
			{team.homeAway === "away" && <TeamLogo logo={team.team.logo} />}
			<div className="space-y-1 text-sm flex flex-col items-center justify-center w-48">
				<h3 className="font-medium leading-none">{team.team.displayName}</h3>
				<p className="text-sm text-muted-foreground">{team.score}</p>
			</div>
			{team.homeAway === "home" && <TeamLogo logo={team.team.logo} />}
		</div>
	);
}

// TODO: handle no games on the day
function ScoreCard({
	competition,
}: { competition: ScoresResponse["events"][number]["competitions"][number] }) {
	const homeTeam = competition.competitors.find(
		(team) => team.homeAway === "home",
	);
	const awayTeam = competition.competitors.find(
		(team) => team.homeAway === "away",
	);
	if (!homeTeam || !awayTeam) {
		return null;
	}

	return (
		<div className="flex flex-col sm:flex-row justify-center w-full space-x-4 hover:bg-muted transition-all py-6 items-center sm:h-[80px]">
			<TeamCard team={homeTeam} />
			<div>vs</div>
			<TeamCard team={awayTeam} />
		</div>
	);
}

export function Scores({ scores }: { scores: ScoresResponse }) {
	return (
		<ScrollArea className="max-h-1/2 items-center justify-center bg-background rounded-md">
			<div className="flex flex-col items-center justify-center border h-full rounded-md">
				{scores.events.map(
					(event) =>
						event.competitions[0] && (
							<ScoreCard key={event.id} competition={event.competitions[0]} />
						),
				)}
			</div>
			<ScrollBar orientation="vertical" />
		</ScrollArea>
	);
}
