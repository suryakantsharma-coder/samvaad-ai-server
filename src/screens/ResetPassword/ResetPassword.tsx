import { Eye, EyeOff } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthSplitLayout } from "../../components/auth/AuthSplitLayout";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { resetPasswordWithToken } from "../../data/auth";
import { showError, showSuccess } from "../../lib/toast";
import { cn } from "../../lib/utils";

const MIN_PASSWORD_LEN = 8;

export const ResetPassword = (): JSX.Element => {
  const [searchParams] = useSearchParams();
  const token = useMemo(
    () => (searchParams.get("token") ?? "").trim(),
    [searchParams],
  );
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const inputClass =
    "h-11 rounded-xl border-stroke bg-white text-[15px] shadow-sm placeholder:text-x-70/70 focus-visible:ring-2 focus-visible:ring-primary-2/35";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) {
      showError("Invalid link", "Missing reset token. Open the link from your email.");
      return;
    }
    if (password.length < MIN_PASSWORD_LEN) {
      showError(
        "Password too short",
        `Use at least ${MIN_PASSWORD_LEN} characters.`,
      );
      return;
    }
    if (password !== confirm) {
      showError("Passwords don't match", "Please re-enter the same password twice.");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      await resetPasswordWithToken(token, password);
      showSuccess("Password updated", "You can log in with your new password.");
      navigate("/login", { replace: true });
    } catch (err) {
      showError(
        "Reset failed",
        err instanceof Error ? err.message : "Could not reset password.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthSplitLayout
      title="Set a new password"
      subtitle="Choose a strong password you haven't used here before."
      heroTitle="You're almost back in."
      heroSubtitle="After saving, sign in with your email and the new password you set here."
      authSwitch={
        <>
          <Link
            to="/login"
            className="font-medium text-primary-2 hover:underline"
          >
            Back to log in
          </Link>
          {" · "}
          <Link
            to="/forgot-password"
            className="font-medium text-primary-2 hover:underline"
          >
            Request a new link
          </Link>
        </>
      }
    >
      {!token ? (
        <div className="flex flex-col gap-4 rounded-xl border border-stroke bg-grey-light/40 px-4 py-5 text-[15px] leading-relaxed text-x-70">
          <p>
            This page needs a valid <code className="text-sm">token</code> in
            the URL (from your reset email).
          </p>
          <Button
            type="button"
            asChild
            className="h-11 rounded-xl bg-primary-2 text-white hover:bg-primary-2/90"
          >
            <Link to="/forgot-password">Request a reset email</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="reset-password"
              className="text-sm font-medium text-x-70"
            >
              New password
            </label>
            <div className="relative">
              <Input
                id="reset-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={`At least ${MIN_PASSWORD_LEN} characters`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(inputClass, "pr-11")}
                required
                minLength={MIN_PASSWORD_LEN}
              />
              <button
                type="button"
                className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-r-xl text-x-70 transition-colors hover:text-x-70/90"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="reset-password-confirm"
              className="text-sm font-medium text-x-70"
            >
              Confirm password
            </label>
            <Input
              id="reset-password-confirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repeat password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClass}
              required
              minLength={MIN_PASSWORD_LEN}
            />
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="h-11 w-full rounded-xl bg-primary-2 text-[15px] font-medium text-white shadow-sm hover:bg-primary-2/90"
          >
            {submitting ? "Saving…" : "Save new password"}
          </Button>
        </form>
      )}
    </AuthSplitLayout>
  );
};
