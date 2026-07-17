import { Check, Cloud, LogIn, LogOut, Mail, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { IpcError, ipc } from "@/lib/ipc";
import type { CloudAccount, OtpChallenge } from "@/lib/types";

type Step = "account" | "email" | "code";

export function CloudAccountCard({
  onAccountChange,
}: {
  onAccountChange: (account: CloudAccount | null) => void;
}) {
  const [account, setAccount] = useState<CloudAccount | null>(null);
  const [step, setStep] = useState<Step>("account");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  const updateAccount = (next: CloudAccount | null) => {
    setAccount(next);
    onAccountChange(next);
    window.dispatchEvent(
      new CustomEvent("markd:cloud-account", {
        detail: { signedIn: Boolean(next) },
      }),
    );
  };

  useEffect(() => {
    let disposed = false;
    void ipc
      .cloudAccountStatus()
      .then((status) => {
        if (!disposed) updateAccount(status.account);
      })
      .catch((cause) => {
        if (!disposed) {
          setError(cause instanceof Error ? cause.message : String(cause));
        }
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(() => {
      setResendIn((value) => Math.max(0, value - 1));
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  const message = (cause: unknown) =>
    cause instanceof IpcError
      ? cause.message
      : cause instanceof Error
        ? cause.message
        : String(cause);

  const requestCode = async () => {
    setBusy(true);
    setError(null);
    try {
      const next = await ipc.cloudRequestOtp(email.trim());
      setChallenge(next);
      setEmail(next.email);
      setCode("");
      setResendIn(next.resendAfter);
      setStep("code");
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    if (!challenge) return;
    setBusy(true);
    setError(null);
    try {
      const next = await ipc.cloudVerifyOtp(challenge.challengeId, code);
      updateAccount(next);
      setStep("account");
      setChallenge(null);
      setCode("");
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setBusy(true);
    setError(null);
    try {
      await ipc.cloudSignOut();
      updateAccount(null);
      setEmail("");
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl bg-panel p-1">
      <div className="rounded-[10px] bg-bg px-3.5 py-3">
        {step === "account" && (
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-panel text-muted">
              {account ? (
                <span className="text-[12px] font-semibold uppercase text-ink">
                  {account.email.slice(0, 1)}
                </span>
              ) : (
                <Cloud size={16} strokeWidth={1.7} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-[12.5px] font-semibold text-ink">
                  {loading ? "Checking account…" : (account?.email ?? "Not signed in")}
                </p>
                {account && (
                  <span className="rounded-full border border-line px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-faint">
                    {account.plan === "cloud" ? "Cloud" : "Free"}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[10.5px] text-faint">
                {account
                  ? "Publishing is connected to this Markd account."
                  : "Your local notes stay available without an account."}
              </p>
            </div>
            {account ? (
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                disabled={busy}
                onClick={signOut}
              >
                <LogOut size={13} strokeWidth={1.8} />
                {busy ? "Signing out…" : "Sign out"}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                className="shrink-0"
                disabled={loading}
                onClick={() => {
                  setError(null);
                  setStep("email");
                }}
              >
                <LogIn size={13} strokeWidth={1.8} />
                Sign in
              </Button>
            )}
          </div>
        )}

        {step === "email" && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void requestCode();
            }}
          >
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-panel text-muted">
                <Mail size={13.5} strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-[12.5px] font-semibold text-ink">Sign in with email</p>
                <p className="mt-0.5 text-[10.5px] text-faint">
                  We’ll send a six-digit code. No password needed.
                </p>
              </div>
            </div>
            <label className="mt-3 block">
              <span className="sr-only">Email address</span>
              <Input
                autoFocus
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                disabled={busy}
                placeholder="you@example.com"
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <div className="mt-3 flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setStep("account")}>Cancel</Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="ml-auto"
                disabled={busy || !email.trim()}
              >
                {busy ? "Sending…" : "Send code"}
              </Button>
            </div>
          </form>
        )}

        {step === "code" && challenge && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void verifyCode();
            }}
          >
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-panel text-muted">
                <Check size={13.5} strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] font-semibold text-ink">Check your email</p>
                <p className="mt-0.5 truncate text-[10.5px] text-faint">
                  Code sent to {challenge.email}
                </p>
              </div>
            </div>
            <label className="mt-3 block">
              <span className="sr-only">Six-digit verification code</span>
              <Input
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={code}
                disabled={busy}
                placeholder="000000"
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                className="h-11 text-center font-mono text-[18px] font-semibold tracking-[0.32em]"
              />
            </label>
            <div className="mt-3 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setError(null);
                  setStep("email");
                }}
              >
                Change email
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={busy || resendIn > 0}
                onClick={() => void requestCode()}
              >
                <RotateCcw size={12} strokeWidth={1.8} />
                {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend"}
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="ml-auto"
                disabled={busy || code.length !== 6}
              >
                {busy ? "Verifying…" : "Verify"}
              </Button>
            </div>
          </form>
        )}

        {error && (
          <p role="alert" className="mt-3 border-t border-line-soft pt-2.5 text-[10.5px] leading-4 text-danger">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
