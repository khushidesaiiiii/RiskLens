"use client";

import { configureAmplify } from "@/lib/amplify";

export default function AmplifyProvider({
    children,
}) {
    configureAmplify();

    return children;
}