import React from "react";

export const Container = ({ children }: { children: React.ReactNode }) => (
    <div className="max-w-[1200px] mx-auto px-8">{children}</div>
);
