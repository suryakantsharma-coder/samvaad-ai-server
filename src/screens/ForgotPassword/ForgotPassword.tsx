import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthSplitLayout } from "../../components/auth/AuthSplitLayout";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { requestPasswordResetEmail } from "../../data/auth";
import { showError, showSuccess } from "../../lib/toast";

export const ForgotPassword = (): JSX.Element => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const inputClass =
    "h-11 rounded-xl border-stroke bg-white text-[15px] shadow-sm placeholder:text-x-70/70 focus-visible:ring-2 focus-visible:ring-primary-2/35";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await requestPasswordResetEmail(email);
      setSent(true);
      showSuccess(
        "Check your email",
        "If an account exists for that address, we sent a reset link.",
      );
    } catch (err) {
      showError(
        "Request failed",
        err instanceof Error ? err.message : "Could not send reset email.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthSplitLayout
      title="Forgot password"
      subtitle="Enter your account email and we'll send you a link to choose a new password."
      heroTitle="Account recovery, without the runaround."
      heroSubtitle="Use the link in your email to set a new password. Links expire quickly for your security."
      authSwitch={
        <>
          Remember your password?{" "}
          <Link
            to="/login"
            className="font-medium text-primary-2 hover:underline"
          >
            Back to log in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="flex flex-col gap-4 rounded-xl border border-stroke bg-grey-light/40 px-4 py-5 text-[15px] leading-relaxed text-x-70">
          <p>
            If <span className="font-medium text-black">{email.trim()}</span> is
            registered, you'll get an email with a reset link shortly.
          </p>
          <p className="text-sm">
            Didn't receive it? Check spam, or try again in a few minutes.
          </p>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl border-stroke"
            onClick={() => {
              setSent(false);
            }}
          >
            Use a different email
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="forgot-email"
              className="text-sm font-medium text-x-70"
            >
              Email
            </label>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              placeholder="you@hospital.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="h-11 w-full rounded-xl bg-primary-2 text-[15px] font-medium text-white shadow-sm hover:bg-primary-2/90"
          >
            {submitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthSplitLayout>
  );
};
