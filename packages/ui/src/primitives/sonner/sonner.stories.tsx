import type { FC } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "@/primitives/button";

import { toast } from "sonner";
import { Toaster } from ".";

type ToastType =
	| "normal"
	| "action"
	| "success"
	| "info"
	| "warning"
	| "error"
	| "loading"
	| "default";

const ToastDemo: FC<{ message: string; type: ToastType }> = (props) => {
	return (
		<Button
			variant="outline"
			onClick={() => {
				switch (props.type) {
					case "normal":
						toast(props.message);
						break;
					case "action":
						toast(props.message, {
							action: <Button variant="outline">Action</Button>,
						});
						break;
					case "success":
						toast.success(props.message);
						break;
					case "info":
						toast.info(props.message);
						break;
					case "warning":
						toast.warning(props.message);
						break;
					case "error":
						toast.error(props.message);
						break;
					case "loading":
						toast.loading(props.message);
						break;
					case "default":
						toast(props.message);
						break;
				}
			}}
		>
			Show Toast
		</Button>
	);
};

const meta: Meta<typeof ToastDemo> = {
	component: ToastDemo,
	args: {
		type: "normal",
	},
	render: (args) => (
		<div>
			<ToastDemo {...args} />
			<Toaster />
		</div>
	),
};

export default meta;

type Story = StoryObj<typeof ToastDemo>;

export const Default: Story = {};

export const Simple: Story = {
	args: {
		type: "normal",
	},
};

export const WithTitle: Story = {
	args: {
		type: "info",
		message: "There was a problem with your request.",
	},
};

export const WithAction: Story = {
	args: {
		type: "action",
		message: "There was a problem with your request.",
	},
};

export const Warning: Story = {
	args: {
		type: "warning",
		message: "There was a problem with your request.",
	},
};

export const ErrorToast: Story = {
	args: {
		type: "error",
		message: "There was a problem with your request.",
	},
};

export const Success: Story = {
	args: {
		type: "success",
		message: "Loaded your data!.",
	},
};

export const Loading: Story = {
	args: {
		type: "loading",
		message: "Loading your data.",
	},
};
