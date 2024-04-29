import "server-only";

import { auth } from "@/auth";
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
import { nanoid, sleep } from "@/lib/utils";
import {
	NBANewsSchema,
	NBAScoresSchema,
	getNbaNews,
	getNbaScores,
} from "@hooper/core/espn";
import {
	createAI,
	createStreamableUI,
	createStreamableValue,
	getAIState,
	getMutableAIState,
	render,
} from "ai/rsc";
import OpenAI from "openai";
import { Resource } from "sst";
import { match } from "ts-pattern";
import { z } from "zod";

export type Message = {
	role: "user" | "assistant" | "system" | "function" | "data" | "tool";
	content: string;
	id: string;
	name?: string;
};

export type AIState = {
	chatId: string;
	messages: Message[];
};

export type UIState = {
	id: string;
	display: React.ReactNode;
}[];

const openai = new OpenAI({
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

	const aiState = getMutableAIState<typeof AI>();
	aiState.update({
		...aiState.get(),
		messages: [
			...aiState.get().messages,
			{
				id: nanoid(),
				role: "user",
				content,
			},
		],
	});

	let textStream: undefined | ReturnType<typeof createStreamableValue<string>>;
	let textNode: undefined | React.ReactNode;

	const ui = render({
		provider: openai,
		model: "gpt-3.5-turbo",
		initial: <SpinnerMessage />,
		messages: [
			{
				role: "system",
				content: `\
You are an AI agent that helps users ask questions and get information about what is going on in the NBA. 
You are allowed to respond like die-hard NBA fan and have opinions about players and teams, but always remember to be respectful and helpful.
Today's date is ${new Date().toLocaleDateString()}
`,
			},
			// biome-ignore lint/suspicious/noExplicitAny: TODO: use ChatCompletion union types
			...aiState.get().messages.map((info: any) => ({
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
				aiState.done({
					...aiState.get(),
					messages: [
						...aiState.get().messages,
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
		functions: {
			getNews: {
				description: "Get the latest NBA news",
				parameters: z.object({
					query: z.string().optional().describe("The search query"),
				}),
				render: async function* ({ query }) {
					yield <NewsSkeleton />;

					try {
						// TODO: sort based on search query
						const articles = await getNbaNews();
						aiState.done({
							...aiState.get(),
							messages: [
								...aiState.get().messages,
								{
									id: nanoid(),
									role: "function",
									name: "getNews",
									content: JSON.stringify(articles),
								},
							],
						});
						<BotCard>
							<News news={articles} />
						</BotCard>;
					} catch (error) {
						console.error(error);
						aiState.done({
							...aiState.get(),
							messages: [
								...aiState.get().messages,
								{
									id: nanoid(),
									role: "function",
									name: "getNews",
									content: "Failed to get news.",
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
					date: z.date().describe("The date to get scores for"),
				}),
				render: async function* ({ date }) {
					yield <BotMessage content={`Searching for scores on ${date}...`} />;
					yield <ScoresSkeleton />;

					try {
						console.log("Getting scores for", new Date(date));
						const response = await getNbaScores(new Date(date));
						aiState.done({
							...aiState.get(),
							messages: [
								...aiState.get().messages,
								{
									id: nanoid(),
									role: "function",
									name: "getScores",
									content: JSON.stringify(response),
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
						aiState.done({
							...aiState.get(),
							messages: [
								...aiState.get().messages,
								{
									id: nanoid(),
									role: "function",
									name: "getScores",
									content: "Failed to get scores.",
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
		id: Date.now(),
		display: ui,
	};
}

// AI is a provider you wrap your application with so you can access AI and UI state in your components.
export const AI = createAI<AIState, UIState>({
	actions: {
		submitUserMessage,
	},
	initialUIState: [],
	initialAIState: { chatId: nanoid(), messages: [] },
	onGetUIState: async () => {
		"use server";

		const session = await auth();

		if (session?.user) {
			const aiState = getAIState();

			if (aiState) {
				const uiState = getUIStateFromAIState(aiState);
				return uiState;
			}
		} else {
			return;
		}
	},
	onSetAIState: async ({ state, done }) => {
		"use server";

		const session = await auth();

		if (session?.user) {
			const { chatId, messages } = state;

			const createdAt = new Date();
			const userId = session.user.id as string;
			const path = `/chat/${chatId}`;
			const title = messages[0].content.substring(0, 100);

			const chat: Chat = {
				id: chatId,
				title,
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

export const getUIStateFromAIState = (aiState: Chat) => {
	function getDisplay(message: Message): JSX.Element | null {
		return match(message.role)
			.with("function", () => {
				if (message.name === "getNews") {
					try {
						const data = JSON.parse(message.content);
						const news = NBANewsSchema.parse(data);
						return (
							<BotCard>
								<News news={news} />
							</BotCard>
						);
					} catch (err) {
						console.error("Failed to parse articles...", err);
						return <BotErrorMessage content={"Failed to parse articles..."} />;
					}
				}

				if (message.name === "getScores") {
					try {
						const data = JSON.parse(message.content);
						const scores = NBAScoresSchema.parse(data);
						return (
							<BotCard>
								<Scores scores={scores} />
							</BotCard>
						);
					} catch (err) {
						console.error("Failed to parse scores...", err);
						return <BotErrorMessage content={"Failed to parse scores..."} />;
					}
				}

				return null;
			})
			.with("user", () => <UserMessage>{message.content}</UserMessage>)
			.with("assistant", () => <BotMessage content={message.content} />)
			.with("data", () => null)
			.with("tool", () => null)
			.with("system", () => null)
			.exhaustive();
	}

	return aiState.messages
		.filter((message) => message.role !== "system")
		.map((message, index) => ({
			id: `${aiState.id}-${index}`,
			display: getDisplay(message),
		}));
};
