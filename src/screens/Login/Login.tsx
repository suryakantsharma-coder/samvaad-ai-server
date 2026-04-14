import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthSplitLayout } from "../../components/auth/AuthSplitLayout";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useAuth } from "../../contexts/AuthProvider";
import { getHomePathForRole } from "../../lib/userRole";
import { showError } from "../../lib/toast";
import { cn } from "../../lib/utils";

const REMEMBER_EMAIL_KEY = "samvaad_login_email";

export const Login = (): JSX.Element => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { handleLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (saved) {
        setEmail(saved);
        setRememberMe(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const user = await handleLogin(email, password);
      try {
        if (rememberMe && email.trim()) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      } catch {
        /* ignore */
      }
      navigate(getHomePathForRole(user.role), { replace: true });
    } catch {
      showError("Error", "Failed to login. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "h-11 rounded-xl border-stroke bg-white text-[15px] shadow-sm placeholder:text-x-70/70 focus-visible:ring-2 focus-visible:ring-primary-2/35";

  return (
    <AuthSplitLayout
      title="Welcome back"
      subtitle="Enter your email and password to access your dashboard."
      heroTitle="Run your hospital operations from one calm, connected workspace."
      heroSubtitle="Sign in to manage patients, appointments, prescriptions, and teams — tailored to your role."
      // authSwitch={
      //   <>
      //     Don&apos;t have an account?{" "}
      //     <Link
      //       to="/signup"
      //       className="font-medium text-primary-2 hover:underline"
      //     >
      //       Register now
      //     </Link>
      //   </>
      // }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="login-email"
            className="text-sm font-medium text-x-70"
          >
            Email
          </label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@hospital.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="login-password"
            className="text-sm font-medium text-x-70"
          >
            Password
          </label>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(inputClass, "pr-11")}
              required
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

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          {/* <label className="flex cursor-pointer items-center gap-2 text-x-70 select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-stroke text-primary-2 focus:ring-primary-2/40"
            />
            Remember me
          </label> */}
          <Link
            to="/forgot-password"
            className="font-medium text-primary-2 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="h-11 w-full rounded-xl bg-primary-2 text-[15px] font-medium text-white shadow-sm hover:bg-primary-2/90"
        >
          {submitting ? "Signing in…" : "Log in"}
        </Button>
      </form>
    </AuthSplitLayout>
  );
};
