import { z } from "zod";

const ArticleSchema = z.object({
	description: z.string(),
	links: z.object({
		web: z.object({
			href: z.string(),
		}),
	}),
	headline: z.string(),
	images: z.array(
		z.object({
			url: z.string(),
			caption: z.string().optional(),
			height: z.number().optional(),
			width: z.number().optional(),
		}),
	),
});

export const NBANewsSchema = z.object({
	articles: z.array(ArticleSchema),
});

export const getNbaNews = async () => {
	const response = await fetch(
		"https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news",
	);
	const data = await response.json();

	const result = NBANewsSchema.parse(data);
	return result;
};

function formatDateAsYYYYMMDD(date: Date) {
	const year = date.getFullYear();
	const month = date.getMonth() + 1; // JavaScript months are 0-based.
	const day = date.getDate() + 1;

	// Pad the month and day with leading zeros if necessary
	const formattedMonth = month.toString().padStart(2, "0");
	const formattedDay = day.toString().padStart(2, "0");

	return `${year}${formattedMonth}${formattedDay}`;
}

export const NBAScoresSchema = z.object({
	events: z.array(
		z.object({
			id: z.string(),
			name: z.string(),
			shortName: z.string(),
			competitions: z.array(
				z.object({
					competitors: z.array(
						z.object({
							id: z.string(),
							homeAway: z.enum(["home", "away"]),
							score: z.string(),
							team: z.object({
								location: z.string(),
								name: z.string(),
								abbreviation: z.string(),
								displayName: z.string(),
								logo: z.string(),
							}),
						}),
					),
				}),
			),
		}),
	),
});

export const getNbaScores = async (date: Date) => {
	// Format date as YYYYMMDD
	// Need to sutract 1 from date

	const formattedDate = formatDateAsYYYYMMDD(date);
	console.log(formattedDate);
	console.log(
		`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${formattedDate}`,
	);
	const response = await fetch(
		`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${formattedDate}`,
	);

	const data = await response.json();
	const result = NBAScoresSchema.parse(data);

	return result;
};

// getNbaScores(new Date()).then(console.log);
//  Tomorrows scores:
// getNbaScores(new Date(Date.now() + 24 * 60 * 60 * 1000)).then(console.log);
