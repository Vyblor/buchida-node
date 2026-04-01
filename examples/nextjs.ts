/**
 * Next.js example — send email from an API route handler.
 *
 * Place this file at: app/api/send/route.ts
 */
import { Buchida } from "buchida";
import { NextResponse } from "next/server";

const buchida = new Buchida(process.env.BUCHIDA_API_KEY!);

export async function POST(request: Request) {
	const { to, subject, html } = await request.json();

	try {
		const { id } = await buchida.emails.send({
			from: "noreply@yourdomain.com",
			to,
			subject,
			html,
		});

		return NextResponse.json({ id });
	} catch (error) {
		console.error("Failed to send email:", error);
		return NextResponse.json(
			{ error: "Failed to send email" },
			{ status: 500 },
		);
	}
}
