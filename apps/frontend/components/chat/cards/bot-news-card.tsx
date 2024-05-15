"use client";

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useCopyToClipboard } from "@/lib/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";
import type { NBANewsSchema } from "@hooper/core/espn";
import Image from "next/image";
import React from "react";
import { toast } from "sonner";
import type { z } from "zod";

type News = z.infer<typeof NBANewsSchema>;

interface NewsArticleProps extends React.HTMLAttributes<HTMLDivElement> {
	article: News["articles"][number];
	aspectRatio?: "portrait" | "square";
	width: number;
	height: number;
}

function NewsArticle({
	article,
	aspectRatio = "portrait",
	width,
	height,
	className,
	...props
}: NewsArticleProps) {
	const { copyToClipboard } = useCopyToClipboard({ timeout: 1000 });

	const copyShareLink = React.useCallback(
		async (article: News["articles"][number]) => {
			const url = new URL(article.links.web.href);
			copyToClipboard(url.toString());
			toast.success("Share link copied to clipboard");
		},
		[copyToClipboard],
	);

	return (
		<a
			href={article.links.web.href}
			className="block hover:bg-muted/40 transition-all"
		>
			<div className={cn("space-y-3 p-2", className)} {...props}>
				<ContextMenu>
					<ContextMenuTrigger>
						<div className="space-y-3 flex flex-col">
							<div className="overflow-hidden rounded-md">
								<Image
									// TODO: need actual placeholder image
									src={article.images[0]?.url ?? "/images/placeholder.png"}
									alt={article.images[0]?.caption ?? "Article image"}
									width={width}
									height={height}
									className={cn(
										"h-auto w-auto object-cover transition-all hover:scale-105",
										aspectRatio === "portrait"
											? "aspect-[3/4]"
											: "aspect-square",
									)}
								/>
							</div>

							<div className="space-y-1 text-sm">
								<h3 className="font-medium leading-none">{article.headline}</h3>
								<p className="text-xs text-muted-foreground">
									{article.description}
								</p>
							</div>
						</div>
					</ContextMenuTrigger>
					<ContextMenuContent className="w-40">
						<ContextMenuItem onClick={() => copyShareLink(article)}>
							Copy article link
						</ContextMenuItem>
					</ContextMenuContent>
				</ContextMenu>
			</div>
		</a>
	);
}

export function News({ news }: { news: News }) {
	return (
		<ScrollArea>
			<div className="flex space-x-1 pb-4">
				{news.articles.map((article) => (
					<NewsArticle
						article={article}
						key={article.headline}
						className="w-[150px]"
						aspectRatio="square"
						width={150}
						height={150}
					/>
				))}
			</div>
			<ScrollBar orientation="horizontal" />
		</ScrollArea>
	);
}

export function NewsSkeleton() {
	return (
		<ScrollArea>
			<div className="flex space-x-1 pb-4">
				{[...Array(5)].map((val, _) => (
					<div
						key={val}
						className="w-[150px] h-[250px] bg-gray-200 animate-pulse rounded-md"
					/>
				))}
			</div>
			<ScrollBar orientation="horizontal" />
		</ScrollArea>
	);
}
