import { ArrowRight, AtSign, Loader2 } from "lucide-react";
import { useState } from "react";
import OtpVerify from "./OtpVerify";

export default function FteLogin({ notify }: { notify: (msg: string) => void }) {
  const [email, setEmail] = useState("ops.rahul@gmail.com");
  const [stage, setStage] = useState<"idle" | "loading" | "sent">("idle");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stage === "loading") return;
    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email.trim())) {
      setError("Enter a valid Gmail address.");
      return;
    }
    setError("");
    setStage("loading");
    setTimeout(() => setStage("sent"), 1000);
  };

  if (stage === "sent") {
    return (
      <OtpVerify
        destination={email}
        onBack={() => setStage("idle")}
        onDone={() => notify("FTE access granted — demo session")}
        backLabel="Back to Gmail"
      />
    );
  }

  return (
    <form noValidate onSubmit={submit} className="rise w-full">
      <h2 className="font-display text-[17px] font-semibold text-ink">
        Continue with Gmail
      </h2>
      <p className="mt-1 text-[12.5px] text-muted">
        We&apos;ll send an OTP to your Gmail — no password needed.
      </p>

      <label htmlFor="gmail-fte" className="mt-3 block text-[11.5px] font-semibold uppercase tracking-wider text-faint">Gmail</label>
      <div className={`mt-1.5 flex h-11 items-stretch rounded-xl border bg-white/[0.07] transition-all duration-200 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/20 ${error ? "border-danger/70" : "border-line"}`}>
        <span className="grid w-10 shrink-0 place-items-center text-faint"><AtSign className="h-4 w-4" /></span>
        <input id="gmail-fte" type="email" value={email} onChange={(e)=>{setEmail(e.target.value); setError("");}} placeholder="name@gmail.com" aria-label="Gmail" className="min-w-0 flex-1 bg-transparent text-[13.5px] text-ink outline-none placeholder:text-faint" />
      </div>
      {error && <p className="mt-2 text-[12px] text-danger">{error}</p>}

      <button type="submit" disabled={stage === "loading"} className="btn-shine group mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-2 font-display text-[14px] font-semibold text-white shadow-lg shadow-accent/30 transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110">
        {stage === "loading" ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending OTP…</> : <>Continue with Gmail <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}
      </button>

      <p className="mt-3 text-center text-[12px] text-muted">
        By continuing you agree to the <a href="#" onClick={(e)=>{e.preventDefault(); notify("Privacy Policy — full release")}} className="font-semibold text-link underline-offset-4 hover:underline">Privacy Policy</a> &amp; <a href="#" onClick={(e)=>{e.preventDefault(); notify("Terms of Use — full release")}} className="font-semibold text-link underline-offset-4 hover:underline">Terms of Use</a>.
      </p>
    </form>
  );
}
