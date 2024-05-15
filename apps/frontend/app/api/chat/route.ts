import { createOpenAI } from "@ai-sdk/openai";
import {
	type CoreMessage,
	StreamData,
	StreamingTextResponse,
	streamText,
} from "ai";
import { Resource } from "sst";

// Create an OpenAI API client
const openai = createOpenAI({
	apiKey: Resource.OpenAiApiKey.value,
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
	const { messages } = (await req.json()) as { messages: Array<CoreMessage> };

	const result = await streamText({
		model: openai("gpt-3.5-turbo"),
		messages,
	});

	const data = new StreamData();

	// Convert response into a stream
	const stream = result.toAIStream({
		onFinal(_) {
			data.close();
		},
	});

	// Respond with stream
	return new StreamingTextResponse(stream, {}, data);
}
