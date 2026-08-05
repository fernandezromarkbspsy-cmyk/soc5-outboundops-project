import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import BackroomLogin from "./components/BackroomLogin";
import FooterBar from "./components/FooterBar";
import FteLogin from "./components/FteLogin";
import QrPanel from "./components/QrPanel";
import Reveal from "./components/Reveal";
import UserTypeToggle, { type UserType } from "./components/UserTypeToggle";

type Toast = { id: number; msg: string };

export default function App() {
  const [toast, setToast] = useState<Toast | null>(null);
  const [userType, setUserType] = useState<UserType>("FTE");

  const notify = (msg: string) => setToast({ id: Date.now(), msg });

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(id);
  }, [toast]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-page via-page to-page-2 px-4 py-6">
      {/* ambient glows visible through the glass */}
      <div
        aria-hidden
        className="drift absolute -top-32 left-[12%] h-[360px] w-[360px] rounded-full bg-accent/25 blur-[100px]"
      />
      <div
        aria-hidden
        className="drift-slow absolute -bottom-36 right-[8%] h-[380px] w-[380px] rounded-full bg-[#82a9ff]/20 blur-[110px]"
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:52px_52px]"
      />

      <main className="relative w-full max-w-[860px] overflow-hidden rounded-2xl border border-white/20 bg-white/[0.08] shadow-[0_30px_70px_-28px_rgba(14,24,54,0.65)] backdrop-blur-2xl">
        <div className="relative grid lg:grid-cols-[1fr_1fr]">
          <QrPanel />

          <div
            aria-hidden
            className="absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-line lg:block"
          />
          <div className="absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-white/10 font-display text-[10.5px] font-semibold tracking-wider text-muted backdrop-blur-md">
              OR
            </span>
          </div>

          <div className="flex items-center gap-3 px-5 lg:hidden">
            <span className="h-px flex-1 bg-line" />
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/25 bg-white/10 font-display text-[10.5px] font-semibold tracking-wider text-muted">
              OR
            </span>
            <span className="h-px flex-1 bg-line" />
          </div>

          {/* right: role toggle sits directly above the form heading */}
          <section className="flex items-center justify-center px-5 py-7 sm:px-7">
            <Reveal delay={140} className="w-full max-w-[330px]">
              <div className="mb-4">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
                  Login as
                </span>
                <UserTypeToggle value={userType} onChange={setUserType} />
              </div>

              {userType === "FTE" ? (
                <FteLogin key="fte" notify={notify} />
              ) : (
                <BackroomLogin key="backroom" notify={notify} />
              )}
            </Reveal>
          </section>
        </div>

        <FooterBar />
      </main>

      {toast && (
        <div
          key={toast.id}
          role="status"
          className="toast-in fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap rounded-full border border-white/20 bg-deep/90 px-4 py-2 text-[12.5px] font-medium text-ink shadow-2xl shadow-[#141f3d]/50 backdrop-blur-md"
        >
          <Info className="h-4 w-4 shrink-0 text-link" strokeWidth={2.2} />
          {toast.msg}
        </div>
      )}
    </div>
  );
}
