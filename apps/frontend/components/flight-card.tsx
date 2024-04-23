// An example of a flight card component.
export function FlightCard({
	flightInfo,
}: {
	flightInfo: { flightNumber: string; departure: string; arrival: string };
}) {
	return (
		<div>
			<h2>Flight Information</h2>
			<p>Flight Number: {flightInfo.flightNumber}</p>
			<p>Departure: {flightInfo.departure}</p>
			<p>Arrival: {flightInfo.arrival}</p>
		</div>
	);
}
