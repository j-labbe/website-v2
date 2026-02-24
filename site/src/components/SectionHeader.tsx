import { Divider } from "./Divider";

export const SectionHeader = ({ text, infoTooltip }: { text: string; infoTooltip?: string }) => (
    <div className="mb-6">
        <div className="mb-2">
            {infoTooltip ? (
                <span className="group relative inline-block" tabIndex={0}>
                    <span className="font-mono text-text-dim text-sm">
                        // <span className="underline decoration-dotted underline-offset-4 cursor-help">{text}</span>
                    </span>
                    <span className="react-activity-calendar__tooltip absolute bottom-full left-0 z-10 mb-1 !max-w-[60vw] whitespace-normal break-all rounded bg-text p-2 text-xs text-bg opacity-0 transition-opacity pointer-events-none group-hover:opacity-100 group-focus-within:opacity-100">
                        {infoTooltip}
                    </span>
                </span>
            ) : (
                <span className="font-mono text-text-dim text-sm cursor-default">// {text}</span>
            )}
        </div>
        <Divider />
    </div>
);
