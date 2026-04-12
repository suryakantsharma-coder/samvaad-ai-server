import { Eye, EyeOff } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthSplitLayout } from "../../components/auth/AuthSplitLayout";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { useAuth } from "../../contexts/AuthProvider";
import { showError, showWarning } from "../../lib/toast";
import { cn } from "../../lib/utils";

export const Signup = (): JSX.Element => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("user");
  const [name, setName] = useState("");
  const [hospitalId, setHospitalId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { handleRegister } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (password !== confirmPassword) {
      showWarning("Warning", "Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await handleRegister(
        email,
        password,
        name,
        role,
        hospitalId.trim(),
      );
      navigate("/login");
    } catch {
      showError("Error", "Failed to sign up. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "h-11 rounded-xl border-stroke bg-white text-[15px] shadow-sm placeholder:text-x-70/70 focus-visible:ring-2 focus-visible:ring-primary-2/35";

  return (
    <AuthSplitLayout
      title="Create your account"
      subtitle="Enter your details to get started. You may need a hospital ID if your admin invited you."
      heroTitle="Onboard your team and keep every workflow in sync."
      heroSubtitle="Samvaad AI helps hospitals coordinate care, billing, and communication — securely and at scale."
      authSwitch={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-primary-2 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="signup-name" className="text-sm font-medium text-x-70">
            Full name
          </label>
          <Input
            id="signup-name"
            type="text"
            autoComplete="name"
            placeholder="Dr. Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="signup-email" className="text-sm font-medium text-x-70">
            Email
          </label>
          <Input
            id="signup-email"
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
            htmlFor="signup-password"
            className="text-sm font-medium text-x-70"
          >
            Password
          </label>
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
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
        <div className="flex flex-col gap-2">
          <label
            htmlFor="signup-confirm"
            className="text-sm font-medium text-x-70"
          >
            Confirm password
          </label>
          <Input
            id="signup-confirm"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="signup-hospital" className="text-sm font-medium text-x-70">
            Hospital ID{" "}
            <span className="font-normal text-x-70">(optional)</span>
          </label>
          <Input
            id="signup-hospital"
            type="text"
            placeholder="Provided by your administrator"
            value={hospitalId}
            onChange={(e) => setHospitalId(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-x-70">Role</span>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger
              id="signup-role"
              className="h-11 w-full rounded-xl border-stroke bg-white text-[15px] shadow-sm focus:ring-2 focus:ring-primary-2/35"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="doctor">Doctor</SelectItem>
              <SelectItem value="receptionist">Receptionist</SelectItem>
              <SelectItem value="nurse">Nurse</SelectItem>
              <SelectItem value="lab technician">Lab Technician</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          type="submit"
          disabled={submitting}
          className="h-11 w-full rounded-xl bg-primary-2 text-[15px] font-medium text-white shadow-sm hover:bg-primary-2/90"
        >
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthSplitLayout>
  );
};
