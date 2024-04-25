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

		const TursoURL = new sst.Secret("TursoURL", "file:local.db");
		const TursoToken = new sst.Secret("TursoToken");

		// const dns = sst.vercel.dns({
		// 	domain: "walln.dev",
		// });
		const web = new sst.aws.Nextjs("Web", {
			// domain: {
			// 	name: "hooper.walln.dev",
			// 	dns: dns,
			// },
			link: [bucket, TursoURL, TursoToken],
		});

		return {
			bucket: bucket.name,
		};
	},
});
