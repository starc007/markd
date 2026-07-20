const OTP_SENDER = "no-reply@usemarkd.app";
const MARKD_DOWNLOAD_URL = "https://usemarkd.app/download";
const MARKD_LOGO_URL = "https://usemarkd.app/apple-icon.png";

export async function sendOtpEmail(
  env: { EMAIL: SendEmail },
  email: string,
  code: string,
): Promise<void> {
  await env.EMAIL.send({
    to: email,
    from: { email: OTP_SENDER, name: "Markd" },
    subject: "Your Markd sign-in code",
    text: [
      "Sign in to Markd",
      "",
      `Your verification code is: ${code}`,
      "",
      "This code expires in 5 minutes and can only be used once.",
      "If you did not request this code, you can ignore this email.",
    ].join("\n"),
    html: `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f5f5f3;color:#171717;font-family:Arial,sans-serif">
    <div style="max-width:480px;margin:0 auto;padding:48px 20px">
      <div style="background:#ffffff;border:1px solid #e5e5e2;border-radius:16px;padding:32px">
        <p style="margin:0 0 24px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#737373">Markd</p>
        <h1 style="margin:0;font-size:22px;line-height:1.25">Sign in to Markd</h1>
        <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#666">Enter this code in the Markd desktop app:</p>
        <div style="margin:24px 0;padding:18px 20px;border-radius:12px;background:#f5f5f3;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:30px;font-weight:600;letter-spacing:.24em;text-align:center">${code}</div>
        <p style="margin:0;font-size:12px;line-height:1.6;color:#858585">The code expires in 5 minutes and can only be used once. If you did not request it, you can safely ignore this email.</p>
      </div>
    </div>
  </body>
</html>`,
  });
}

export async function sendWelcomeEmail(
  env: { EMAIL: SendEmail },
  email: string,
): Promise<void> {
  const name = welcomeName(email).toLowerCase();
  await env.EMAIL.send({
    to: email,
    from: { email: OTP_SENDER, name: "saurabh from markd" },
    subject: "welcome to markd",
    text: [
      `hey ${name},`,
      "",
      "i'm saurabh. thanks for trying markd.",
      "",
      "markd doesn't want to become your second brain. your first one already has enough going on.",
      "",
      "it gives you a simple place to write while keeping everything as markdown files you control.",
      "",
      "if you haven't downloaded the app yet, you can find it here:",
      MARKD_DOWNLOAD_URL,
      "",
      "glad you're here,",
      "saurabh",
    ].join("\n"),
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <style>
      :root { color-scheme: light dark; supported-color-schemes: light dark; }
      .email-bg { background: #ffffff !important; }
      .email-text { color: #171717 !important; }
      .email-muted { color: #5f5f5f !important; }
      .email-link { color: #171717 !important; }
      @media (prefers-color-scheme: dark) {
        .email-bg { background: #151515 !important; }
        .email-text { color: #f5f5f3 !important; }
        .email-muted { color: #b1b1ad !important; }
        .email-link { color: #f5f5f3 !important; }
      }
    </style>
  </head>
  <body class="email-bg" style="margin:0;background:#ffffff;font-family:Arial,sans-serif;-webkit-font-smoothing:antialiased">
    <div class="email-bg" style="min-height:100%;background:#ffffff;padding:56px 24px">
      <div style="max-width:520px;margin:0 auto">
        <img src="${MARKD_LOGO_URL}" width="44" height="44" alt="Markd" style="display:block;width:44px;height:44px;border:0;border-radius:11px">
        <h1 class="email-text" style="margin:36px 0 0;color:#171717;font-size:24px;line-height:1.15;letter-spacing:-.02em">hey ${name},</h1>
        <p class="email-muted" style="margin:20px 0 0;color:#5f5f5f;font-size:16px;line-height:1.6">i'm saurabh. thanks for trying markd.</p>
        <p class="email-muted" style="margin:16px 0 0;color:#5f5f5f;font-size:16px;line-height:1.6">markd doesn't want to become your second brain. your first one already has enough going on.</p>
        <p class="email-muted" style="margin:16px 0 0;color:#5f5f5f;font-size:16px;line-height:1.6">it gives you a simple place to write while keeping everything as markdown files you control.</p>
        <p class="email-muted" style="margin:16px 0 0;color:#5f5f5f;font-size:16px;line-height:1.6">if you haven't downloaded the app yet, <a class="email-link" href="${MARKD_DOWNLOAD_URL}" style="color:#171717;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px">you can find it here</a>.</p>
        <p class="email-text" style="margin:32px 0 0;color:#171717;font-size:16px;line-height:1.6">glad you're here,<br>saurabh</p>
      </div>
    </div>
  </body>
</html>`,
  });
}

export function welcomeName(email: string): string {
  const localPart = email.split("@", 1)[0] ?? "";
  const firstPart = localPart.split(/[._+-]/, 1)[0] ?? "";
  const letters = firstPart.replace(/[^a-z]/gi, "");
  if (letters.length < 2) return "there";
  return `${letters[0].toUpperCase()}${letters.slice(1).toLowerCase()}`;
}

export function queueWelcomeEmail(
  ctx: ExecutionContext,
  env: { EMAIL: SendEmail },
  email: string,
): void {
  ctx.waitUntil(
    sendWelcomeEmail(env, email).catch((cause) => {
      console.error("Welcome email delivery failed", cause);
    }),
  );
}
