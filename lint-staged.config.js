const config = {
	// "*": ["cspell --no-must-find-files", "prettier --list-different"],
	"**/!(sst-env.d).{ts,tsx,js,jsx,cjs,mjs}": ["biome lint", "biome format"],
	// "**/*.{md,mdx}": ["markdownlint"],
	// TODO: Update to yaml when available
	"**/*.json": ["biome lint", "biome format"],
	"**/*.py": ["rye lint", "rye format --check"],
};

export default config;
