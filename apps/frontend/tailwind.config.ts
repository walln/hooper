import type { Config } from "tailwindcss";

import { hooperTailwindPreset } from "@hooper/tailwind";

const config: Config = {
	content: [
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"../../packages/ui/dist/**/*.js",
	],
	darkMode: "class",
	presets: [hooperTailwindPreset],
};

export default config;
