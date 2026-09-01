"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthSession, logout } from "@/lib/auth";
import { createOrganization, getMyOrganization } from "@/lib/organization";

export default function AppLayout({ children }) {
    const router = useRouter();

    const [status, setStatus] = useState("checking");
    const [organization, setOrganization] = useState(null);
    const [orgError, setOrgError] = useState(null);
    const [signingOut, setSigningOut] = useState(false);

    const [orgName, setOrgName] = useState("");
    const [isCreatingOrg, setIsCreatingOrg] = useState(false);
    const [createOrgError, setCreateOrgError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function checkAuthentication() {
            let session;

            try {
                session = await getAuthSession();
            } catch (error) {
                console.error("Authentication check failed:", error);

                if (!cancelled) {
                    router.replace("/login");
                }

                return;
            }

            if (cancelled) {
                return;
            }

            const accessToken = session.tokens?.accessToken;

            if (!accessToken) {
                router.replace("/login");
                return;
            }

            setStatus("loading-organization");

            try {
                const membership = await getMyOrganization();

                if (cancelled) {
                    return;
                }

                if (!membership) {
                    setStatus("no-organization");
                    return;
                }

                setOrganization(membership);
                setStatus("authenticated");
            } catch (error) {
                if (cancelled) {
                    return;
                }

                console.error("Failed to load organization:", error);
                setOrgError(error.message);
                setStatus("organization-error");
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

    async function handleCreateOrganization(event) {
        event.preventDefault();

        const trimmedName = orgName.trim();

        if (!trimmedName) {
            setCreateOrgError("Organization name is required.");
            return;
        }

        setIsCreatingOrg(true);
        setCreateOrgError(null);

        try {
            const created = await createOrganization(trimmedName);

            setOrganization({ organization: created, role: "OWNER" });
            setStatus("authenticated");
            router.replace("/incidents");
        } catch (error) {
            console.error("Failed to create organization:", error);
            setCreateOrgError(error.message);
        } finally {
            setIsCreatingOrg(false);
        }
    }

    if (status === "checking" || status === "loading-organization") {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gray-50">
                <p className="text-sm text-gray-500">
                    {status === "checking"
                        ? "Checking your session..."
                        : "Loading your organization..."}
                </p>
            </main>
        );
    }

    if (status === "no-organization") {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
                <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow-sm">
                    <h1 className="text-lg font-semibold text-gray-900">
                        Create your organization
                    </h1>

                    <p className="mt-2 text-sm text-gray-600">
                        Your account isn&apos;t a member of any RiskLens
                        organization yet. Create one to get started —
                        you&apos;ll be its owner.
                    </p>

                    {createOrgError && (
                        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                            {createOrgError}
                        </div>
                    )}

                    <form
                        onSubmit={handleCreateOrganization}
                        className="mt-6 space-y-4"
                    >
                        <div>
                            <label
                                htmlFor="orgName"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Organization name
                            </label>

                            <input
                                id="orgName"
                                type="text"
                                required
                                value={orgName}
                                onChange={(event) => setOrgName(event.target.value)}
                                placeholder="e.g. RiskLens Development"
                                className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isCreatingOrg}
                            className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                        >
                            {isCreatingOrg ? "Creating..." : "Create Organization"}
                        </button>
                    </form>

                    <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="mt-4 w-full rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        {signingOut ? "Signing out..." : "Sign out"}
                    </button>
                </div>
            </main>
        );
    }

    if (status === "organization-error") {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
                <div className="w-full max-w-md rounded-lg border border-red-300 bg-red-50 p-8 text-center">
                    <h1 className="text-lg font-semibold text-red-900">
                        Couldn&apos;t load your organization
                    </h1>

                    <p className="mt-2 text-sm text-red-700">{orgError}</p>

                    <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="mt-6 rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                        {signingOut ? "Signing out..." : "Sign out"}
                    </button>
                </div>
            </main>
        );
    }

    return (
        <div className="min-h-screen">
            <header className="flex items-center justify-between border-b bg-white px-6 py-4">
                <div>
                    <span className="text-sm font-semibold text-gray-900">
                        RiskLens
                    </span>

                    {organization && (
                        <span className="ml-3 text-sm text-gray-500">
                            {organization.organization.name}
                        </span>
                    )}
                </div>

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
