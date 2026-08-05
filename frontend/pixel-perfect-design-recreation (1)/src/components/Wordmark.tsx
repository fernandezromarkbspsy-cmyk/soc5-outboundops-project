/** Approximation of the Disney+ Hotstar wordmark shown at the QR centre. */
export default function Wordmark() {
  return (
    <div className="relative flex select-none flex-col items-center leading-none">
      <svg
        aria-hidden
        viewBox="0 0 64 18"
        fill="none"
        className="pointer-events-none absolute -top-[9px] left-1/2 h-[15px] w-[62px] -translate-x-1/2 text-[#17244d]"
      >
        <path
          d="M3 16C12 4.5 52 4.5 61 16"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-script text-[19px] leading-none text-[#17244d]">
        Disney+
      </span>
      <span className="mt-[4px] text-[11px] font-extrabold leading-none tracking-[0.02em] text-[#17244d]">
        hotstar
      </span>
    </div>
  );
}
