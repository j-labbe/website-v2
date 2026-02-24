export const DataErrorMessage = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
    <div className="pb-4">
        <p className="text-text-dim font-mono text-sm">
            {message}
            {onRetry && (
                <>
                    {" "}
                    <button
                        type="button"
                        onClick={onRetry}
                        className="text-text-dim underline underline-offset-2 decoration-text-dim/40 hover:decoration-text-dim transition-colors"
                    >
                        Retry
                    </button>
                </>
            )}
        </p>
    </div>
);
