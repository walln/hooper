/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
	app(input) {
		return {
			name: "hooper",
			home: "cloudflare",
			removal: input?.stage === "production" ? "retain" : "remove",
			providers: { "@pulumiverse/vercel": true, aws: true },
		};
	},
	async run() {
		const bucket = new sst.cloudflare.Bucket("MyBucket");

		const TURSO_URL = new sst.Secret("TursoURL", "file:local.db");
		const TURSO_TOKEN = new sst.Secret("TursoToken");
		const OPENAI_API_KEY = new sst.Secret("OpenAiApiKey");
		const AUTH_SECRET = new sst.Secret("AuthSecret");

		// const dns = sst.vercel.dns({
		// 	domain: "walln.dev",
		// });
		const web = new sst.aws.Nextjs("Web", {
			// domain: {
			// 	name: "hooper.walln.dev",
			// 	dns: dns,
			// },
			link: [bucket, TURSO_URL, TURSO_TOKEN, OPENAI_API_KEY, AUTH_SECRET],
		});

		return {
			bucket: bucket.name,
		};
	},
});
