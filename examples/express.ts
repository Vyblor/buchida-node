/**
 * Express example — send email from an Express route.
 *
 * Run:
 *   BUCHIDA_API_KEY=bc_test_xxx npx tsx examples/express.ts
 *   curl -X POST http://localhost:3001/send \
 *     -H "Content-Type: application/json" \
 *     -d '{"to":"user@example.com","subject":"Hello","html":"<p>Hi</p>"}'
 */
import express from "express";
import { Buchida, type SendEmailParams } from "buchida";

const app = express();
app.use(express.json());

const buchida = new Buchida(process.env.BUCHIDA_API_KEY!);

app.post("/send", async (req, res) => {
	const { to, subject, html } = req.body as Pick<
		SendEmailParams,
		"to" | "subject" | "html"
	>;

	try {
		const { id } = await buchida.emails.send({
			from: "noreply@yourdomain.com",
			to,
			subject,
			html,
		});

		res.json({ id });
	} catch (error) {
		console.error("Failed to send email:", error);
		res.status(500).json({ error: "Failed to send email" });
	}
});

app.listen(3001, () => {
	console.log("Server running on http://localhost:3001");
});
