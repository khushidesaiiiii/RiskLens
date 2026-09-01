"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    getAuthenticatedUser,
    getAuthSession,
    logout,
} from "@/lib/auth";

export default function AppLayout({ children }) {
    const router = useRouter();

    const [status, setStatus] = useState("checking");
    const [signingOut, setSigningOut] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function checkAuthentication() {
            try {
                const session = await getAuthSession();

                if (cancelled) {
                    return;
                }

                const accessToken = session.tokens?.accessToken;

                if (!accessToken) {
                    router.replace("/login");
                    return;
                }

                setStatus("authenticated");
            } catch (error) {
                console.error(
                    "Authentication check failed:",
                    error
                );

                if (!cancelled) {
                    router.replace("/login");
                }
            }
        }

        checkAuthentication();

        return () => {
            cancelled = true;
        };
    }, [router]);

    async function handleSignOut() {
        setSigningOut(true);

        try {
            await logout();
        } finally {
            router.replace("/login");
        }
    }

    if (status === "checking") {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gray-50">
                <p className="text-sm text-gray-500">
                    Checking your session...
                </p>
            </main>
        );
    }

    return (
        <div className="min-h-screen">
            <header className="flex items-center justify-between border-b bg-white px-6 py-4">
                <span className="text-sm font-semibold text-gray-900">
                    RiskLens
                </span>

                <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    {signingOut ? "Signing out..." : "Sign out"}
                </button>
            </header>

            {children}
        </div>
    );
}
