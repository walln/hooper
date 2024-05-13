import { createSessionBuilder } from "sst/auth";

export const session = createSessionBuilder<{
	user: {
		userId: string;
		email: string;
	};
}>();
