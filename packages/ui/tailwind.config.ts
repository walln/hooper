import type { Config } from "tailwindcss";

import { hooperTailwindPreset } from "@hooper/tailwind";

const config: Config = {
	content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
	darkMode: "class",
	presets: [hooperTailwindPreset],
};

export default config;
