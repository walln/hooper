import "server-only";

import { News, NewsSkeleton } from "@/components/chat/cards/bot-news-card";
import {
	Scores,
	ScoresSkeleton,
} from "@/components/chat/cards/bot-scores-card";
import {
	BotCard,
	BotErrorMessage,
	BotMessage,
	SpinnerMessage,
	UserMessage,
} from "@/components/chat/message";
import { saveChat } from "@/lib/actions";
import { checkRateLimit } from "@/lib/rate-limit";
import type { Chat } from "@/lib/types";
import { nanoid } from "@/lib/utils";
import { createOpenAI } from "@ai-sdk/openai";
import { auth } from "@hooper/auth/next-client";
import {
	NBANewsSchema,
	NBAScoresSchema,
	getNbaNews,
	getNbaScores,
} from "@hooper/core/espn";
import type { Message } from "@hooper/db/schema";
import {
	createAI,
	createStreamableValue,
	getAIState,
	getMutableAIState,
	streamUI,
} from "ai/rsc";
import { Resource } from "sst";
import { z } from "zod";

const openai = createOpenAI({
	apiKey: Resource.OpenAiApiKey.value,
});

async function submitUserMessage(content: string) {
	"use server";

	// Check for rate limit
	const allowed = await checkRateLimit();
	if (!allowed) {
		return {
			id: Date.now(),
			display: <BotErrorMessage content={"Rate limited. Try again later."} />,
		};
	}

	const history = getMutableAIState<typeof AI>();

	// update the AI state with the new user message
	history.update({
		...history.get(),
		messages: [
			...history.get().messages,
			{
				id: nanoid(),
				role: "user",
				content,
			},
		],
	});

	let textStream: undefined | ReturnType<typeof createStreamableValue<string>>;
	let textNode: undefined | React.ReactNode;

	const result = await streamUI({
		model: openai("gpt-3.5-turbo"),
		initial: <SpinnerMessage />,
		messages: [
			{
				role: "system",
				content: `\
You are an AI agent that helps users ask questions and get information about what is going on in the NBA. 
You are allowed to respond like die-hard NBA fan and have opinions about players and teams, but always remember to be respectful and helpful.
Today's date is ${new Date().toLocaleDateString("en-US", {
					timeZone: "America/New_York",
				})}.

Only use tools that are available to you. If asked about statistics or information that you cannot get
from your available tools, you should respond that you don't have that information and that the functionality is coming soon.
`,
			},
			// biome-ignore lint/suspicious/noExplicitAny: TODO: use ChatCompletion union types
			...history.get().messages.map((info: any) => ({
				role: info.role,
				content: info.content,
				name: info.name,
			})),
		],
		text: ({ content, done, delta }) => {
			if (!textStream) {
				textStream = createStreamableValue("");
				textNode = <BotMessage content={textStream.value} />;
			}

			if (done) {
				textStream.done();
				history.done({
					...history.get(),
					messages: [
						...history.get().messages,
						{
							id: nanoid(),
							role: "assistant",
							content,
						},
					],
				});
			} else {
				textStream.update(delta);
			}

			return textNode;
		},
		temperature: 0,
		tools: {
			getNews: {
				description: "Get the latest NBA news",
				parameters: z.object({
					query: z.string().optional().describe("The search query"),
				}),
				generate: async function* ({ query }) {
					yield <NewsSkeleton />;

					const toolCallId = nanoid();

					try {
						// TODO: sort based on search query
						const articles = await getNbaNews();
						history.done({
							...history.get(),
							messages: [
								...history.get().messages,
								{
									id: nanoid(),
									role: "assistant",
									content: [
										{
											type: "tool-call",
											toolName: "getNews",
											toolCallId,
											args: { query },
										},
									],
								},
								{
									id: nanoid(),
									role: "tool",
									content: [
										{
											type: "tool-result",
											toolName: "getNews",
											toolCallId,
											result: articles,
										},
									],
								},
							],
						});
						return (
							<BotCard>
								<News news={articles} />
							</BotCard>
						);
					} catch (error) {
						console.error(error);
						history.done({
							...history.get(),
							messages: [
								...history.get().messages,
								{
									id: nanoid(),
									role: "assistant",
									content: [
										{
											type: "tool-call",
											toolName: "getNews",
											toolCallId,
											args: { query },
										},
									],
								},
								{
									id: nanoid(),
									role: "tool",
									content: [
										{
											type: "tool-result",
											toolName: "getNews",
											toolCallId,
											result: JSON.stringify(error),
										},
									],
								},
							],
						});
						return <BotErrorMessage content={"Failed to get news."} />;
					}
				},
			},
			getScores: {
				description: "Get the latest NBA scores for a given day",
				parameters: z.object({
					date: z
						.string()
						.date()
						.describe("The date to get scores for in YYYY-MM-DD format."),
				}),
				generate: async function* ({ date }) {
					yield <BotMessage content={`Searching for scores on ${date}...`} />;
					yield <ScoresSkeleton />;

					const toolCallId = nanoid();

					try {
						console.log("Getting scores for", new Date(date));
						const response = await getNbaScores(new Date(date));
						history.done({
							...history.get(),
							messages: [
								...history.get().messages,
								{
									id: nanoid(),
									role: "assistant",
									content: [
										{
											type: "tool-call",
											toolName: "getScores",
											toolCallId,
											args: { date },
										},
									],
								},
								{
									id: nanoid(),
									role: "tool",
									content: [
										{
											type: "tool-result",
											toolName: "getScores",
											toolCallId,
											result: response,
										},
									],
								},
							],
						});
						return (
							<BotCard>
								<Scores scores={response} />
							</BotCard>
						);
					} catch (error) {
						console.error(error);
						history.done({
							...history.get(),
							messages: [
								...history.get().messages,
								{
									id: nanoid(),
									role: "assistant",
									content: [
										{
											type: "tool-call",
											toolName: "getScores",
											toolCallId,
											args: { date },
										},
									],
								},
								{
									id: nanoid(),
									role: "tool",
									content: [
										{
											type: "tool-result",
											toolName: "getScores",
											toolCallId,
											result: JSON.stringify(error),
										},
									],
								},
							],
						});
						return <BotErrorMessage content={"Failed to get scores."} />;
					}
				},
			},
		},
	});

	return {
		id: nanoid(),
		display: result.value,
	};
}

export type AIState = {
	chatId: string;
	messages: Message[];
};

export type UIState = {
	id: string;
	display: React.ReactNode;
}[];

export const AI = createAI<AIState, UIState>({
	actions: {
		submitUserMessage,
	},
	initialUIState: [],
	initialAIState: { chatId: nanoid(), messages: [] },
	onGetUIState: async () => {
		"use server";

		const session = await auth();

		if (session.type === "user") {
			const history = getAIState();

			if (history) {
				const uiState = getUIStateFromAIState(history);
				return uiState;
			}
		}
		return;
	},
	onSetAIState: async ({ state }) => {
		"use server";

		const session = await auth();

		if (session.type === "user") {
			const { chatId, messages } = state;

			const createdAt = new Date();
			const userId = session.properties.userId as string;
			const path = `/chat/${chatId}`;

			const firstMessageContent = messages[0]?.content as string;
			const title = firstMessageContent.substring(0, 100);

			const chat: Chat = {
				id: chatId,
				title: title,
				userId,
				createdAt,
				messages,
				path,
				sharePath: null,
			};

			await saveChat(chat);
		} else {
			return;
		}
	},
});

export const getUIStateFromAIState = (history: Chat) => {
	return history.messages
		.filter((message) => message.role !== "system")
		.map((message, index) => ({
			id: `${history.id}-${index}`,
			display:
				message.role === "tool" ? (
					message.content.map((tool) => {
						if (tool.toolName === "getNews") {
							const news = NBANewsSchema.parse(tool.result);
							return (
								<BotCard>
									<News news={news} />
								</BotCard>
							);
						}

						if (tool.toolName === "getScores") {
							const scores = NBAScoresSchema.parse(tool.result);
							return (
								<BotCard>
									<Scores scores={scores} />
								</BotCard>
							);
						}

						return null;
					})
				) : message.role === "user" ? (
					<UserMessage>{message.content as string}</UserMessage>
				) : message.role === "assistant" &&
					typeof message.content === "string" ? (
					<BotMessage content={message.content} />
				) : null,
		}));
};
