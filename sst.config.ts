/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
	app(input) {
		return {
			name: "hooper",
			home: "cloudflare",
			removal: input?.stage === "production" ? "retain" : "remove",
			providers: {
				aws: true,
				"@pulumiverse/vercel": true,
				"@upstash/pulumi": true,
			},
		};
	},
	async run() {
		const bucket = new sst.cloudflare.Bucket("MyBucket");
		const TURSO_URL = new sst.Secret("TursoURL", "file:local.db");
		const TURSO_TOKEN = new sst.Secret("TursoToken");
		const OPENAI_API_KEY = new sst.Secret("OpenAiApiKey");
		const AUTH_SECRET = new sst.Secret("AuthSecret");

		const auth = new sst.aws.Auth("Auth", {
			authenticator: {
				handler: "./packages/auth/src/server.handler",
				url: true,
				link: [TURSO_URL, TURSO_TOKEN],
				environment: {
					// TODO: should be a way to not need this
					WEB_URL: $dev ? "http://localhost:3000" : "https://hooper.walln.dev",
				},
			},
		});

		const redis = new upstash.RedisDatabase("Redis", {
			region: "us-east-1",
			databaseName: "hooper",
		});

		const dns = sst.vercel.dns({
			domain: "walln.dev",
		});
		const web = new sst.aws.Nextjs("Web", {
			domain: {
				name: "hooper.walln.dev",
				dns: dns,
			},
			environment: {
				REDIS_ENDPOINT: redis.endpoint,
				REDIS_TOKEN: redis.restToken,
				// TODO: fix this
				AUTH_URL: auth.authenticator.url,
			},
			link: [bucket, auth, TURSO_URL, TURSO_TOKEN, OPENAI_API_KEY, AUTH_SECRET],
		});

		return {
			auth: auth.authenticator.url,
			bucket: bucket.name,
			web: web.url,
		};
	},
});
