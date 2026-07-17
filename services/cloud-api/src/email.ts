const OTP_SENDER = "no-reply@usemarkd.app";

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
