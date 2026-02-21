import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useAuth } from "../../contexts/AuthProvider";
import { showError } from "../../lib/toast";

export const Login = (): JSX.Element => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { handleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login:", { email, password });
    try {
      await handleLogin(email, password);
      navigate("/patients");
    } catch (error) {
      showError("Error", "Failed to login. Please check your credentials.");
    }
  };

  return (
    <div className="bg-app-background w-full min-h-screen flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to your account
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
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
        {/* <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p> */}
      </div>
    </div>
  );
};
