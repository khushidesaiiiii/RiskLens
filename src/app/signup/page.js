"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { signUp, confirmSignUp, resendSignUpCode, login } from "@/lib/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUpPage() {
    const router = useRouter();

    const [step, setStep] = useState("signup");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [code, setCode] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [resending, setResending] = useState(false);
    const [resendMessage, setResendMessage] = useState("");

    async function handleSignUp(event) {
        event.preventDefault();
        setError("");

        if (!EMAIL_REGEX.test(email)) {
            setError("Enter a valid email address.");
            return;
        }

        if (!password) {
            setError("Password is required.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const result = await signUp(email, password);

            if (result?.nextStep?.signUpStep === "CONFIRM_SIGN_UP") {
                setStep("verify");
            } else {
                setStep("verified");
            }
        } catch (signUpError) {
            console.error("Sign up failed:", signUpError);
            setError(signUpError.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleVerify(event) {
        event.preventDefault();
        setError("");

        if (!code.trim()) {
            setError("Enter the verification code.");
            return;
        }

        setLoading(true);

        try {
            const result = await confirmSignUp(email, code.trim());

            if (!result?.isSignUpComplete) {
                setError("Verification did not complete. Please try again.");
                return;
            }

            try {
                const signInResult = await login(email, password);

                if (signInResult?.isSignedIn) {
                    router.replace("/dashboard");
                    return;
                }
            } catch (signInError) {
                console.error(
                    "Automatic sign-in after verification failed:",
                    signInError
                );
            }

            setStep("verified");
        } catch (verifyError) {
            console.error("Email verification failed:", verifyError);
            setError(verifyError.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleResendCode() {
        setResending(true);
        setResendMessage("");
        setError("");

        try {
            await resendSignUpCode(email);
            setResendMessage("A new verification code has been sent.");
        } catch (resendError) {
            console.error("Resend code failed:", resendError);
            setError(resendError.message);
        } finally {
            setResending(false);
        }
    }

    if (step === "verified") {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
                <div className="w-full max-w-md rounded-lg border bg-white p-8 text-center shadow-sm">
                    <h1 className="text-2xl font-bold">Email verified</h1>

                    <p className="mt-2 text-sm text-gray-600">
                        Your email has been verified. Sign in to continue.
                    </p>

                    <button
                        type="button"
                        onClick={() => router.replace("/login")}
                        className="mt-6 w-full rounded-lg bg-black px-4 py-2 text-white"
                    >
                        Sign in
                    </button>
                </div>
            </main>
        );
    }

    if (step === "verify") {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
                <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow-sm">
                    <h1 className="text-2xl font-bold">Check your email</h1>

                    <p className="mt-2 text-sm text-gray-600">
                        We sent a verification code to <strong>{email}</strong>.
                    </p>

                    {error && (
                        <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {resendMessage && (
                        <div className="mt-6 rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-700">
                            {resendMessage}
                        </div>
                    )}

                    <form onSubmit={handleVerify} className="mt-6 space-y-5">
                        <div>
                            <label
                                htmlFor="code"
                                className="block text-sm font-medium"
                            >
                                Verification code
                            </label>

                            <input
                                id="code"
                                type="text"
                                value={code}
                                onChange={(event) => setCode(event.target.value)}
                                className="mt-1 w-full rounded-lg border px-3 py-2"
                                autoComplete="one-time-code"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
                        >
                            {loading ? "Verifying..." : "Verify Email"}
                        </button>
                    </form>

                    <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={resending}
                        className="mt-4 w-full rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        {resending ? "Resending..." : "Resend Code"}
                    </button>

                    <button
                        type="button"
                        onClick={() => setStep("signup")}
                        className="mt-4 w-full text-center text-sm text-gray-500 hover:underline"
                    >
                        Back to sign up
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
            <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow-sm">
                <h1 className="text-2xl font-bold">
                    Create your RiskLens account
                </h1>

                <p className="mt-2 text-sm text-gray-600">
                    Sign up to get started with RiskLens.
                </p>

                {error && (
                    <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignUp} className="mt-6 space-y-5">
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
                            onChange={(event) => setEmail(event.target.value)}
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
                            onChange={(event) => setPassword(event.target.value)}
                            className="mt-1 w-full rounded-lg border px-3 py-2"
                            autoComplete="new-password"
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="block text-sm font-medium"
                        >
                            Confirm Password
                        </label>

                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(event) =>
                                setConfirmPassword(event.target.value)
                            }
                            className="mt-1 w-full rounded-lg border px-3 py-2"
                            autoComplete="new-password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
                    >
                        {loading ? "Signing up..." : "Sign Up"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="font-medium text-black hover:underline"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </main>
    );
}
