"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getAuthSession, logout } from "@/lib/auth";
import { getMyOrganization } from "@/lib/organization";
import OrganizationOnboardingForm from "@/components/organization/OrganizationOnboardingForm";
import OrganizationMenu from "@/components/organization/OrganizationMenu";
import { OrganizationProvider } from "@/components/organization/OrganizationContext";

const NAV_LINKS = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/incidents", label: "Incidents" },
];

export default function AppLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();

    const [status, setStatus] = useState("checking");
    const [organization, setOrganization] = useState(null);
    const [orgError, setOrgError] = useState(null);
    const [signingOut, setSigningOut] = useState(false);

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

    // Re-fetches myOrganization() rather than trusting createOrganization's
    // return value directly — AppSync/DynamoDB stays the single source of
    // truth for "does this user have an organization now", not the shape
    // of whichever mutation happened to just run.
    async function refreshOrganization() {
        const membership = await getMyOrganization();

        if (!membership) {
            // Shouldn't happen right after a successful createOrganization,
            // but never render Dashboard with no organization — stay on
            // onboarding rather than risk a redirect loop.
            setStatus("no-organization");
            return null;
        }

        setOrganization(membership);
        setStatus("authenticated");
        return membership;
    }

    async function handleOrganizationCreated() {
        setStatus("loading-organization");

        try {
            const membership = await refreshOrganization();

            if (membership) {
                router.replace("/dashboard");
            }
        } catch (error) {
            console.error(
                "Failed to refresh organization after creation:",
                error
            );
            setOrgError(error.message);
            setStatus("organization-error");
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
                <div className="flex w-full max-w-md flex-col items-center gap-4">
                    <OrganizationOnboardingForm
                        onSuccess={handleOrganizationCreated}
                    />

                    <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="w-full rounded-lg border bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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

                    <div className="mt-6 flex justify-center gap-3">
                        <button
                            type="button"
                            onClick={async () => {
                                setStatus("loading-organization");

                                try {
                                    await refreshOrganization();
                                } catch (error) {
                                    console.error(
                                        "Retry: failed to load organization:",
                                        error
                                    );
                                    setOrgError(error.message);
                                    setStatus("organization-error");
                                }
                            }}
                            className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-100"
                        >
                            Retry
                        </button>

                        <button
                            type="button"
                            onClick={handleSignOut}
                            disabled={signingOut}
                            className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                            {signingOut ? "Signing out..." : "Sign out"}
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <OrganizationProvider
            value={{
                organization: organization?.organization ?? null,
                role: organization?.role ?? null,
                refresh: refreshOrganization,
            }}
        >
            <div className="min-h-screen">
                <header className="flex items-center justify-between border-b bg-white px-6 py-4">
                    <div className="flex items-center gap-6">
                        <span className="text-sm font-semibold text-gray-900">
                            RiskLens
                        </span>

                        <nav className="flex items-center gap-4">
                            {NAV_LINKS.map((link) => {
                                const isActive = pathname?.startsWith(
                                    link.href
                                );

                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={
                                            isActive
                                                ? "text-sm font-medium text-gray-900"
                                                : "text-sm text-gray-500 hover:text-gray-900"
                                        }
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        {organization && (
                            <div className="border-l pl-6">
                                <OrganizationMenu
                                    organization={organization.organization}
                                />
                            </div>
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
        </OrganizationProvider>
    );
}
