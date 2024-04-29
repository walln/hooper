import { auth } from "@/auth";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

function getEnv() {
	const token = process.env.REDIS_TOKEN;
	const endpoint = process.env.REDIS_ENDPOINT;

	if (!token || !endpoint) {
		console.log(process.env);
		throw new Error("Missing REDIS_TOKEN or REDIS_ENDPOINT");
	}

	return { token, endpoint };
}

const redis = new Redis({
	url: getEnv().endpoint,
	token: getEnv().token,
});

const ratelimit = {
	authenticated: new Ratelimit({
		redis,
		prefix: "ratelimit:authenticated",
		limiter: Ratelimit.slidingWindow(10, "5 m"),
	}),
	anonymous: new Ratelimit({
		redis,
		prefix: "ratelimit:anonymous",
		limiter: Ratelimit.slidingWindow(5, "5 d"),
	}),
};

export async function checkRateLimit() {
	const ip = headers().get("x-forwarded-for") || "localhost";
	const session = await auth();
	if (session?.user?.id) {
		const identifier = `ratelimit_${session.user.id}`;
		const { success } = await ratelimit.authenticated.limit(identifier);
		return success;
	}

	const identifier = `ratelimit_${ip}`;
	const { success } = await ratelimit.anonymous.limit(identifier);
	return success;
}
