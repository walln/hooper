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
		const TURSO_URL = new sst.Secret("TursoURL", "file:local.db");
		const TURSO_TOKEN = new sst.Secret("TursoToken");
		const OPENAI_API_KEY = new sst.Secret("OpenAiApiKey");
		const RESEND_API_KEY = new sst.Secret("ResendApiKey");

		const appDomain = $interpolate`${
			$app.stage === "production" ? "hooper" : `${$app.stage}.hooper`
		}.walln.dev`;

		const dns = sst.vercel.dns({
			domain: "walln.dev",
		});

		const auth = new sst.aws.Auth("Auth", {
			authenticator: {
				handler: "./packages/auth/src/server.handler",
				url: true,
				link: [TURSO_URL, TURSO_TOKEN, RESEND_API_KEY],
				environment: {
					WEB_URL: $dev
						? "http://localhost:3000"
						: $interpolate`https://${appDomain}`,
					DEVELOPMENT_EMAILS: !$dev,
				},
			},
		});

		const redis = new upstash.RedisDatabase("Redis", {
			region: "us-east-1",
			databaseName: $interpolate`hooper-${$app.stage}-redis`,
		});

		const web = new sst.aws.Nextjs("Web", {
			path: "./apps/frontend",
			domain: {
				name: appDomain,
				dns: dns,
			},
			environment: {
				REDIS_ENDPOINT: redis.endpoint,
				REDIS_TOKEN: redis.restToken,
				AUTH_URL: auth.authenticator.url,
				WEB_URL: $dev
					? "http://localhost:3000"
					: $interpolate`https://${appDomain}`,
			},
			link: [
				auth,
				auth.authenticator,
				TURSO_URL,
				TURSO_TOKEN,
				OPENAI_API_KEY,
				RESEND_API_KEY,
			],
		});

		return {
			auth: auth.authenticator.url,
			web: web.url,
		};
	},
});
