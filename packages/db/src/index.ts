import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { customAlphabet } from "nanoid";
import { Resource } from "sst";

function createTursoClient() {
	return createClient({
		url: Resource.TursoURL.value,
		authToken: Resource.TursoToken.value,
	});
}

const client = createTursoClient();

export const db = drizzle(client);

export const nanoid = customAlphabet(
	"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
	7,
);
