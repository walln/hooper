import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { Resource } from "sst";

function createTursoClient() {
	return createClient({
		url: Resource.TursoURL.value,
		authToken: Resource.TursoToken.value,
	});
}

const client = createTursoClient();

export const db = drizzle(client);
