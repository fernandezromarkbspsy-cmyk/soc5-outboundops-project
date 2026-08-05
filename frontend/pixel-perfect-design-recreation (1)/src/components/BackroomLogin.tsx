import { useState } from "react";
import { ArrowRight, Eye, EyeOff, IdCard, Loader2, Lock } from "lucide-react";

export default function BackroomLogin({
  notify,
}: {
  notify: (msg: string) => void;
}) {
  const [opsId, setOpsId] = useState("SOC5-4821");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);

  const fail = (msg: string) => {
    setError(msg);
    setShaking(true);
    window.setTimeout(() => setShaking(false), 500);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (opsId.trim().length < 4) return fail("Enter a valid Ops ID.");
    if (password.length < 6)
      return fail("Password must be at least 6 characters.");
    setError("");
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      notify("Backroom access granted — demo session");
    }, 1100);
  };

  return (
    <form noValidate onSubmit={submit} className="rise w-full">
      <h2 className="font-display text-[17px] font-semibold text-ink">
        Backroom sign in
      </h2>
      <p className="mt-1 text-[12.5px] text-muted">
        Use your assigned Ops ID and password.
      </p>

      {/* Ops ID */}
      <label className="mt-4 block text-[11.5px] font-semibold uppercase tracking-wider text-faint">
        Ops ID
      </label>
      <div
        className={`mt-1.5 flex h-11 items-stretch rounded-xl border bg-white/[0.07] transition-all duration-200 focus-within:border-accent focus-within:bg-white/[0.11] focus-within:ring-4 focus-within:ring-accent/20 ${
          shaking ? "animate-shake" : ""
        } ${error ? "border-danger/70" : "border-line"}`}
      >
        <span className="grid w-10 shrink-0 place-items-center text-faint">
          <IdCard className="h-4 w-4" />
        </span>
        <input
          value={opsId}
          onChange={(e) => {
            setOpsId(e.target.value.toUpperCase());
            setError("");
          }}
          placeholder="SOC5-0000"
          aria-label="Ops ID"
          autoComplete="username"
          className="min-w-0 flex-1 bg-transparent pr-3 text-[13.5px] tracking-wide text-ink outline-none placeholder:text-faint"
        />
      </div>

      {/* Password */}
      <label className="mt-3 block text-[11.5px] font-semibold uppercase tracking-wider text-faint">
        Password
      </label>
      <div
        className={`mt-1.5 flex h-11 items-stretch rounded-xl border bg-white/[0.07] transition-all duration-200 focus-within:border-accent focus-within:bg-white/[0.11] focus-within:ring-4 focus-within:ring-accent/20 ${
          error ? "border-danger/70" : "border-line"
        }`}
      >
        <span className="grid w-10 shrink-0 place-items-center text-faint">
          <Lock className="h-4 w-4" />
        </span>
        <input
          type={show ? "text" : "password"}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          placeholder="••••••••"
          aria-label="Password"
          autoComplete="current-password"
          className="min-w-0 flex-1 bg-transparent text-[13.5px] text-ink outline-none placeholder:text-faint"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="px-3 text-faint transition-colors hover:text-ink"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {error && <p className="mt-2 text-[12px] text-danger">{error}</p>}

      <div className="mt-3 flex items-center justify-between">
        <label className="group flex cursor-pointer items-center gap-2 text-[12px] text-muted">
          <span
            className={`grid h-4 w-4 place-items-center rounded border transition-all duration-200 ${
              remember
                ? "border-accent bg-accent"
                : "border-white/30 bg-white/[0.07] group-hover:border-white/50"
            }`}
          >
            {remember && (
              <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
                <path
                  d="M2.5 6.3 4.8 8.6 9.5 3.9"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="sr-only"
          />
          Keep me signed in
        </label>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            notify("Reset link sent to your supervisor");
          }}
          className="text-[12px] font-semibold text-link underline-offset-4 hover:underline"
        >
          Forgot password?
        </a>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-shine group mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-2 font-display text-[14px] font-semibold text-white shadow-lg shadow-accent/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/40 hover:brightness-110 active:translate-y-0 disabled:cursor-wait disabled:opacity-85"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            Sign In
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </>
        )}
      </button>

      <p className="mt-3 text-center text-[12px] text-muted">
        Need an Ops ID?{" "}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            notify("Contact your shift supervisor to provision access");
          }}
          className="font-semibold text-link underline-offset-4 hover:underline"
        >
          Request access
        </a>
      </p>
    </form>
  );
}
