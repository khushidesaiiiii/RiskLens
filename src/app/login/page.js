"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
    login,
    getAuthSession,
    getAuthenticatedUser,
} from "@/lib/auth";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function checkExistingSession() {
            try {
                const session = await getAuthSession();

                if (
                    !cancelled &&
                    session.tokens?.accessToken
                ) {
                    router.replace("/dashboard");
                }
            } catch {
                // No authenticated session.
                // Stay on the login page.
            }
        }

        checkExistingSession();

        return () => {
            cancelled = true;
        };
    }, [router]);

    async function handleSubmit(event) {
        event.preventDefault();

        setLoading(true);
        setError("");

        try {
            const result = await login(email, password);

            if (!result?.isSignedIn) {
                throw new Error("Additional authentication is required.");
            }

            router.replace("/dashboard");
        } catch (error) {
            console.error("Login failed:", error);

            setError(
                error?.message ||
                "Unable to sign in. Please check your credentials."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
            <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow-sm">
                <h1 className="text-2xl font-bold">
                    Sign in to RiskLens
                </h1>

                <p className="mt-2 text-sm text-gray-600">
                    Sign in to access your RiskLens account.
                </p>

                {error && (
                    <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="mt-6 space-y-5"
                >
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium"
                        >
                            Email
                        </label>

                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            className="mt-1 w-full rounded-lg border px-3 py-2"
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium"
                        >
                            Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            className="mt-1 w-full rounded-lg border px-3 py-2"
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/signup"
                        className="font-medium text-black hover:underline"
                    >
                        Sign up
                    </Link>
                </p>
            </div>
        </main>
    );
}