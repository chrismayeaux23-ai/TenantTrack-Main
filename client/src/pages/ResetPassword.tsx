import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import logoPng from "@assets/tenanttrack-final-logo.png";

export default function ResetPassword() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to reset password.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <img src={logoPng} alt="TenantTrack" className="h-16 w-16 rounded-xl object-contain mb-4 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Link</h1>
          <p className="text-muted-foreground text-sm mb-6">This password reset link is invalid or has expired.</p>
          <a href="/login" className="text-primary hover:underline font-medium text-sm">Back to login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src={logoPng} alt="TenantTrack" className="h-16 w-16 rounded-xl object-contain mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
          <p className="text-muted-foreground text-sm mt-1">Enter your new password below</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-foreground font-medium">Password reset!</p>
              <p className="text-sm text-muted-foreground text-center">Your password has been updated. You can now sign in with your new password.</p>
              <a href="/login" className="mt-2">
                <Button data-testid="button-back-to-login">Sign In</Button>
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">New Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(""); }}
                    placeholder="At least 8 characters"
                    required
                    className="pr-10"
                    data-testid="input-new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Confirm Password</label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setError(""); }}
                  placeholder="Re-enter password"
                  required
                  data-testid="input-confirm-new-password"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400" data-testid="text-error">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading} data-testid="button-reset-password">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Resetting...</> : "Reset Password"}
              </Button>
            </form>
          )}
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            <a href="/login" className="hover:text-foreground">← Back to login</a>
          </p>
        </div>
      </div>
    </div>
  );
}
