interface OtpVerifyProps {
    destination: string;
    onBack: () => void;
    onDone: (code: string) => void;
    backLabel?: string;
}
export declare function OtpVerify({ destination, onBack, onDone, backLabel, }: OtpVerifyProps): import("react").JSX.Element;
export {};
