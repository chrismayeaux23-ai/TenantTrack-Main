import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/use-auth";
import { Eye, EyeOff, Loader2, ArrowLeft, Mail } from "lucide-react";
import logoPng from "@assets/tenanttrack-final-logo.png";
import bgMain1 from "@assets/main1_1774750600097.jpg";

const params = new URLSearchParams(window.location.search);
const errorMessages: Record<string, string> = {
  google_not_configured: "Google sign-in is not yet configured. Please use email/password.",
  google_failed: "Google sign-in failed. Please try again or use email/password.",
};

export default function Login() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(
    params.get("signup") ? "signup" : "signin"
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(errorMessages[params.get("error") || ""] || "");
  const [forgotSent, setForgotSent] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setError("");
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.email) { setError("Please enter your email."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      if (res.ok) setForgotSent(true);
      else setError("Something went wrong. Please try again.");
    } catch {
      setError("Connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "signup" && form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/signin";
      const body = mode === "signup"
        ? { firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password }
        : { email: form.email, password: form.password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.requiresVerification) {
          window.location.href = `/verify-email?email=${encodeURIComponent(data.email)}`;
          return;
        }
        setError(data.message || "Something went wrong.");
        return;
      }
      if (data.requiresVerification) {
        window.location.href = `/verify-email?email=${encodeURIComponent(data.email)}`;
        return;
      }
      window.location.href = "/";
    } catch {
      setError("Connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img src={bgMain1} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background/90" />
      </div>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src={logoPng} alt="TenantTrack" className="h-16 w-16 rounded-xl object-contain mb-4" />
          <h1 className="text-2xl font-bold text-foreground">TenantTrack</h1>
          <p className="text-muted-foreground text-sm mt-1">Trusted vendor dispatch for landlords</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">

          {mode === "forgot" ? (
            <>
              <button
                onClick={() => { setMode("signin"); setError(""); setForgotSent(false); }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                data-testid="button-back-to-signin"
              >
                <ArrowLeft className="h-4 w-4" />Back to Sign In
              </button>

              {forgotSent ? (
                <div className="text-center py-4">
                  <Mail className="h-10 w-10 text-primary mx-auto mb-3" />
                  <p className="text-foreground font-medium mb-1">Check your email</p>
                  <p className="text-sm text-muted-foreground">If an account exists for <span className="text-primary">{form.email}</span>, we sent a password reset link.</p>
                  <p className="text-xs text-muted-foreground mt-3">Didn't get it? Check your spam folder.</p>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-sm text-muted-foreground">Enter your email and we'll send you a link to reset your password.</p>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={update("email")}
                      placeholder="you@example.com"
                      required
                      data-testid="input-forgot-email"
                    />
                  </div>
                  {error && <p className="text-sm text-red-400" data-testid="text-error">{error}</p>}
                  <Button type="submit" className="w-full" disabled={loading} data-testid="button-send-reset">
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending...</> : "Send Reset Link"}
                  </Button>
                </form>
              )}
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="w-full gap-3 h-11 mb-4"
                onClick={() => { window.location.href = "/api/auth/google"; }}
                data-testid="button-google-login"
                type="button"
              >
                <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-3 text-muted-foreground">or use email</span>
                </div>
              </div>

              <div className="flex rounded-xl bg-muted p-1 mb-5">
                <button
                  onClick={() => { setMode("signin"); setError(""); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === "signin" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                  data-testid="tab-signin"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setMode("signup"); setError(""); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === "signup" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                  data-testid="tab-signup"
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">First name</label>
                      <Input
                        value={form.firstName}
                        onChange={update("firstName")}
                        placeholder="Chris"
                        required
                        data-testid="input-first-name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Last name</label>
                      <Input
                        value={form.lastName}
                        onChange={update("lastName")}
                        placeholder="Smith"
                        required
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={update("email")}
                    placeholder="you@example.com"
                    required
                    data-testid="input-email"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={update("password")}
                      placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
                      required
                      className="pr-10"
                      data-testid="input-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => { setMode("forgot"); setError(""); }}
                      className="text-xs text-primary hover:underline mt-1.5 block"
                      data-testid="link-forgot-password"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                {mode === "signup" && (
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Confirm password</label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={update("confirmPassword")}
                      placeholder="••••••••"
                      required
                      data-testid="input-confirm-password"
                    />
                  </div>
                )}

                {error && (
                  <p className="text-sm text-red-400" data-testid="text-error">{error}</p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                  data-testid="button-submit"
                >
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Please wait...</>
                    : mode === "signup" ? "Create Account" : "Sign In"
                  }
                </Button>
              </form>
            </>
          )}
        </div>

        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-muted-foreground">
            New to TenantTrack?{" "}
            <a
              href="/guide"
              className="text-primary hover:underline font-medium"
              data-testid="link-guide"
            >
              Read the guide
            </a>
          </p>
          <p className="text-xs text-muted-foreground">
            <a href="/" className="hover:text-foreground">← Back to home</a>
          </p>
        </div>
      </div>
    </div>
  );
}
