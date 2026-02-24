import { useState } from "react";
import { LQIP_DATA_URI } from "../../generated/lqip";

interface LqipImageProps {
    src: string;
    alt: string;
    className?: string;
}

export function LqipImage({ src, alt, className }: LqipImageProps) {
    const [loaded, setLoaded] = useState(false);

    return (
        <>
            <img
                src={LQIP_DATA_URI}
                alt=""
                aria-hidden="true"
                className={`lqip-placeholder ${className}`}
            />
            <img
                src={src}
                alt={alt}
                className={`lqip-full${loaded ? " loaded" : ""} ${className}`}
                onLoad={() => setLoaded(true)}
            />
        </>
    );
}
