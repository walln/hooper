import { auth } from "@hooper/auth/next-client";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";
import { Resource } from "sst";

const redis = new Redis({
	url: Resource.Redis.endpoint,
	token: Resource.Redis.token,
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
	if (session.type === "user") {
		const identifier = `ratelimit_${session.properties.userId}`;
		const { success } = await ratelimit.authenticated.limit(identifier);
		return success;
	}

	const identifier = `ratelimit_${ip}`;
	const { success } = await ratelimit.anonymous.limit(identifier);
	return success;
}
