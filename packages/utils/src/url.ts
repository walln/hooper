export function getBaseUrl() {
	if (typeof window !== "undefined") return window.location.origin;
	return `http://localhost:${
		// biome-ignore lint/complexity/useLiteralKeys: <explanation>
		process.env["PORT"] ?? 3000
	}`;
}
