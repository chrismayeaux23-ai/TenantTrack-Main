import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/Button";
import { Loader2, CheckCircle, Mail } from "lucide-react";
import logoPng from "@assets/tenanttrack-final-logo.png";
import bgMain1 from "@assets/main1_1774750600097.jpg";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email") || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const fullCode = newCode.join("");
    if (fullCode.length === 6) {
      submitCode(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split("");
      setCode(newCode);
      submitCode(pasted);
    }
  };

  const submitCode = async (fullCode: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: fullCode }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Verification failed.");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }
      setSuccess(true);
      setTimeout(() => { window.location.href = "/"; }, 1500);
    } catch {
      setError("Connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setResendCooldown(60);
        setError("");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Failed to resend code.");
      }
    } catch {
      setError("Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    if (!email) setLocation("/login");
  }, [email, setLocation]);

  if (!email) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img src={bgMain1} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background/90" />
      </div>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src={logoPng} alt="TenantTrack" className="h-16 w-16 rounded-xl object-contain mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Verify Your Email</h1>
          <p className="text-muted-foreground text-sm mt-1 text-center">
            We sent a 6-digit code to
          </p>
          <p className="text-primary text-sm font-medium flex items-center gap-1.5 mt-1">
            <Mail className="h-3.5 w-3.5" />{email}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-foreground font-medium">Email verified!</p>
              <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleInput(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className="w-12 h-14 text-center text-2xl font-bold rounded-xl border border-border bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    data-testid={`input-code-${i}`}
                    disabled={loading}
                  />
                ))}
              </div>

              {error && (
                <p className="text-sm text-red-400 text-center mb-4" data-testid="text-error">{error}</p>
              )}

              {loading && (
                <div className="flex justify-center mb-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Didn't receive the code?</p>
                <Button
                  variant="ghost"
                  onClick={handleResend}
                  disabled={resending || resendCooldown > 0}
                  className="text-primary"
                  data-testid="button-resend-code"
                >
                  {resending ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending...</>
                  ) : resendCooldown > 0 ? (
                    `Resend in ${resendCooldown}s`
                  ) : (
                    "Resend Code"
                  )}
                </Button>
              </div>
            </>
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
