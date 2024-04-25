import { defineConfig } from "drizzle-kit";
import { Resource } from "sst";

export default defineConfig({
	schema: "./src/schema/index.ts",
	driver: "turso",
	dbCredentials: {
		authToken: Resource.TursoToken.value,
		url: Resource.TursoURL.value,
	},
	verbose: true,
	strict: true,
});
