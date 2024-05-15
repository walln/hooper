"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { NBAScoresSchema } from "@hooper/core/espn";
import Image from "next/image";
import type { z } from "zod";

type ScoresResponse = z.infer<typeof NBAScoresSchema>;

export function ScoresSkeleton() {
	return (
		<ScrollArea>
			<div className="flex flex-col space-x-1 pb-4">
				{[...Array(10)].map((val, _) => (
					<div
						key={val}
						className="w-[150px] h-[150px] bg-gray-300 animate-pulse"
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
				"h-auto w-auto object-cover transition-all hover:scale-105",
				aspectRatio === "portrait" ? "aspect-[3/4]" : "aspect-square",
			)}
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
		<div className="flex flex-row">
			{team.homeAway === "away" && <TeamLogo logo={team.team.logo} />}
			<div className="space-y-1 text-sm flex flex-col items-center justify-center w-48">
				<h3 className="font-medium leading-none">{team.team.displayName}</h3>
				<p className="text-sm text-muted-foreground">{team.score}</p>
			</div>
			{team.homeAway === "home" && <TeamLogo logo={team.team.logo} />}
		</div>
	);
}

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
		<div className="flex justify-center w-full space-x-4 hover:bg-muted transition-all py-6">
			<TeamCard team={homeTeam} />
			<div>vs</div>
			<TeamCard team={awayTeam} />
		</div>
	);
}

export function Scores({ scores }: { scores: ScoresResponse }) {
	return (
		<ScrollArea className="max-h-1/2 items-center justify-center bg-background">
			<div className="flex flex-col items-center justify-center border h-full">
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
