/**
 * Basic example — send a single email with buchida.
 *
 * Run:
 *   BUCHIDA_API_KEY=bc_test_xxx npx tsx examples/basic.ts
 */
import { Buchida } from "buchida";

const buchida = new Buchida(process.env.BUCHIDA_API_KEY!);

async function main() {
	const { id } = await buchida.emails.send({
		from: "hello@yourdomain.com",
		to: "user@example.com",
		subject: "Hello from buchida",
		html: "<h1>Welcome!</h1><p>Your first email sent with buchida.</p>",
	});

	console.log("Email sent! ID:", id);

	// Retrieve the email status
	const email = await buchida.emails.get(id);
	console.log("Status:", email.status);
}

main().catch(console.error);
