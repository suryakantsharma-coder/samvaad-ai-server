import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

export const Signup = (): JSX.Element => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("user");
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const { handleRegister } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showWarning("Warning", "Passwords do not match.");
      return;
    }

    try {
      await handleRegister(email, password, name, role);
      navigate("/login");
    } catch (error) {
      showError("Error", "Failed to sign up. Please try again.");
    }

    console.log("Signup:", { email, password, confirmPassword, name, role });
  };

  return (
    <div className="bg-app-background w-full min-h-screen flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground">
            Create account
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your details to get started
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium">
              Role
            </label>
            <Select value={role} onValueChange={(value) => setRole(value)}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2.5">
                  <SelectValue />
                </div>
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
          <Button type="submit" className="w-full">
            Sign up
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
