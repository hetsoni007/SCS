import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({ region: process.env.AWS_REGION });
const OWNER = process.env.OWNER_EMAIL;
const FROM = process.env.FROM_EMAIL;
const CALENDLY = "https://calendly.com/het-soni-soniconsultancyservices/introductory";

// CORS is handled by API Gateway's CORS config; the function must NOT also
// emit Access-Control-* headers or HTTP API returns 500 (duplicate headers).
const CORS = {};

function send(to, subject, text) {
  return ses.send(new SendEmailCommand({
    Source: FROM,
    Destination: { ToAddresses: [to] },
    Message: { Subject: { Data: subject }, Body: { Text: { Data: text } } },
  }));
}

export const handler = async (event) => {
  const method = (event.requestContext && event.requestContext.http && event.requestContext.http.method) || event.httpMethod;
  if (method === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };

  let b = {};
  try {
    let raw = event.body || "{}";
    if (event.isBase64Encoded) raw = Buffer.from(raw, "base64").toString("utf8");
    b = JSON.parse(raw);
  } catch (e) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ ok: false, error: "bad json" }) };
  }

  const email = String(b.email || "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ ok: false, error: "invalid email" }) };
  }
  const kind = b.kind || "lead";

  const ownerLines = [
    "New " + kind + " lead from soniconsultancyservices.com",
    "Email: " + email,
    b.name ? "Name: " + b.name : "",
    b.company ? "Company: " + b.company : "",
    b.service ? "Service: " + b.service : "",
    b.type ? "Builder type: " + b.type : "",
    b.template ? "Template: " + b.template : "",
    b.theme ? "Theme: " + b.theme : "",
    b.message ? "\nMessage:\n" + b.message : "",
  ].filter(Boolean).join("\n");
  const ownerBody = b.code ? ownerLines + "\n\n----- GENERATED CODE (" + (b.file || "") + ") -----\n" + b.code : ownerLines;

  const result = { ok: true, owner: false, visitor: false };

  try { await send(OWNER, "New " + kind + " lead: " + email, ownerBody); result.owner = true; }
  catch (e) { result.ownerErr = String(e.name || e); }

  try {
    if (kind === "builder" && b.code) {
      await send(email, "Your code from SCS Studio",
        "Hi,\n\nHere's the " + (b.file || "code") + " you built at soniconsultancyservices.com/builder — drop it straight into your project:\n\n" +
        b.code + "\n\nWant the full thing built for real, by senior React Native & MERN engineers? Just reply to this email, or book a free call: " + CALENDLY + "\n\n— Soni Consultancy Services");
    } else {
      await send(email, "Thanks — we'll be in touch",
        "Hi,\n\nThanks for reaching out to Soni Consultancy Services. We've received your message and will reply within one business day.\n\nWant to talk sooner? Book a free 30-min call: " + CALENDLY + "\n\n— Soni Consultancy Services");
    }
    result.visitor = true;
  } catch (e) { result.visitorErr = String(e.name || e); }

  return { statusCode: 200, headers: Object.assign({ "content-type": "application/json" }, CORS), body: JSON.stringify(result) };
};
