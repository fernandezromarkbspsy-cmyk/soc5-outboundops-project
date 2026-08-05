import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, Check } from "lucide-react";

export default function OtpVerify({
  destination,
  onBack,
  onDone,
  backLabel = "Change email",
}: {
  destination: string;
  onBack: () => void;
  onDone: () => void;
  backLabel?: string;
}) {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [resendIn, setResendIn] = useState(30);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const id = window.setTimeout(() => refs.current[0]?.focus(), 60);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(
      () => setResendIn((s) => (s > 0 ? s - 1 : 0)),
      1000
    );
    return () => window.clearInterval(id);
  }, []);

  const complete = otp.every((d) => d !== "");

  const set = (i: number, value: string) => {
    const d = value.replace(/\D/g, "").slice(-1);
    setOtp((p) => {
      const n = [...p];
      n[i] = d;
      return n;
    });
    if (d && i < 5) refs.current[i + 1]?.focus();
  };

  const key = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const paste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const t = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!t) return;
    e.preventDefault();
    const arr = Array(6).fill("");
    t.split("").forEach((c, i) => (arr[i] = c));
    setOtp(arr);
    refs.current[Math.min(t.length, 5)]?.focus();
  };

  return (
    <div className="rise w-full">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/15 ring-1 ring-accent/40">
          <Check className="h-4 w-4 text-link" strokeWidth={2.6} />
        </span>
        <h2 className="font-display text-[17px] font-semibold text-ink">
          Verify OTP
        </h2>
      </div>
      <p className="mt-2 truncate text-[12.5px] text-muted">
        Code sent to <span className="font-semibold text-ink">{destination}</span>
      </p>

      <div className="mt-4 flex gap-1.5">
        {otp.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={d}
            onChange={(e) => set(i, e.target.value)}
            onKeyDown={(e) => key(i, e)}
            onPaste={i === 0 ? paste : undefined}
            inputMode="numeric"
            maxLength={1}
            aria-label={`Digit ${i + 1}`}
            className="h-10 w-full min-w-0 rounded-lg border border-line bg-white/[0.07] text-center font-display text-[15px] font-semibold text-ink outline-none transition-all duration-200 focus:border-accent focus:bg-white/[0.12] focus:ring-4 focus:ring-accent/20"
          />
        ))}
      </div>

      <button
        type="button"
        disabled={!complete}
        onClick={onDone}
        className={`btn-shine group mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-2 font-display text-[14px] font-semibold text-white shadow-lg shadow-accent/30 transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:translate-y-0 ${
          complete ? "ready-pulse" : ""
        }`}
      >
        Verify &amp; Continue
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </button>

      <div className="mt-3 text-center text-[12px] text-muted">
        {resendIn > 0 ? (
          <>
            Resend in{" "}
            <span className="font-semibold tabular-nums text-ink">
              0:{String(resendIn).padStart(2, "0")}
            </span>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setResendIn(30)}
            className="font-semibold text-link underline-offset-4 transition hover:underline"
          >
            Resend code
          </button>
        )}
        <span className="mx-2 text-white/25">|</span>
        <button
          type="button"
          onClick={onBack}
          className="text-faint underline-offset-4 transition hover:text-muted hover:underline"
        >
          {backLabel}
        </button>
      </div>
    </div>
  );
}
