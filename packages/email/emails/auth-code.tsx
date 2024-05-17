import {
	Body,
	Container,
	Head,
	Heading,
	Html,
	Link,
	Preview,
	Section,
	Text,
} from "@react-email/components";
import * as React from "react";

interface EmailProps {
	code: string;
}

export const AuthenticationCodeEmail = ({ code }: EmailProps) => (
	<Html>
		<Head />
		<Preview>Confirm your email address</Preview>
		<Body style={main}>
			<Container style={container}>
				<Heading style={h1}>Confirm your email address</Heading>
				<Text style={heroText}>
					Your confirmation code is below - enter it in your open browser window
					and we'll help you get signed in.
				</Text>

				<Section style={codeBox}>
					<Text style={confirmationCodeText}>{code}</Text>
				</Section>

				<Text style={text}>
					If you didn't request this email, there's nothing to worry about, you
					can safely ignore it.
				</Text>

				<Section>
					<Link
						style={footerLink}
						href="https://hooper.walln.dev"
						target="_blank"
						rel="noopener noreferrer"
					>
						Hooper
					</Link>
					&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
					<Link
						style={footerLink}
						href="https://walln.dev"
						target="_blank"
						rel="noopener noreferrer"
					>
						walln.dev
					</Link>
					<Text style={footerText}>
						©2024 Nicholas Wall. <br />
						<br />
						<br />
						All rights reserved.
					</Text>
				</Section>
			</Container>
		</Body>
	</Html>
);

AuthenticationCodeEmail.PreviewProps = {
	code: "DJZ-TLX",
} as EmailProps;

export default AuthenticationCodeEmail;

const footerText = {
	fontSize: "12px",
	color: "#b7b7b7",
	lineHeight: "15px",
	textAlign: "left" as const,
	marginBottom: "50px",
};

const footerLink = {
	color: "#b7b7b7",
	textDecoration: "underline",
};

const main = {
	backgroundColor: "#ffffff",
	margin: "0 auto",
	fontFamily:
		"-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const container = {
	margin: "0 auto",
	padding: "60px 20px",
};

const h1 = {
	color: "#1d1c1d",
	fontSize: "36px",
	fontWeight: "700",
	margin: "30px 0",
	padding: "0",
	lineHeight: "42px",
};

const heroText = {
	fontSize: "20px",
	lineHeight: "28px",
	marginBottom: "30px",
};

const codeBox = {
	background: "rgb(245, 244, 245)",
	borderRadius: "4px",
	marginBottom: "30px",
	padding: "40px 10px",
};

const confirmationCodeText = {
	fontSize: "30px",
	textAlign: "center" as const,
	verticalAlign: "middle",
};

const text = {
	color: "#000",
	fontSize: "14px",
	lineHeight: "24px",
};
