"use client";

import Link from "next/link";
import { useOrganization } from "@/components/organization/OrganizationContext";
import OrganizationLogo from "@/components/organization/OrganizationLogo";

export default function DashboardPage() {
    const { organization, role } = useOrganization();

    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-7xl">
                <div className="flex items-center gap-4">
                    {organization && (
                        <OrganizationLogo
                            name={organization.name}
                            logoKey={organization.logoKey}
                            size={48}
                        />
                    )}

                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {organization ? organization.name : "RiskLens"}
                        </h1>

                        <p className="mt-1 text-gray-600">
                            AI-powered risk and incident intelligence
                            {role ? ` — you are ${role.toLowerCase()}` : ""}
                        </p>
                    </div>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-4">
                    <DashboardCard title="Total Incidents" value="0" />
                    <DashboardCard title="Open Incidents" value="0" />
                    <DashboardCard title="High Risk" value="0" />
                    <DashboardCard title="Resolved" value="0" />
                </div>

                <div className="mt-10">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Modules
                    </h2>

                    <div className="mt-4 grid gap-6 md:grid-cols-3">
                        <ModuleCard
                            title="Incident Management"
                            description="Log, review, and track workplace and operational incidents."
                            links={[
                                { href: "/incidents", label: "View Incidents" },
                                {
                                    href: "/incidents/new",
                                    label: "Create Incident",
                                },
                            ]}
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}

function DashboardCard({ title, value }) {
    return (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">{title}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
    );
}

function ModuleCard({ title, description, links }) {
    return (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <p className="mt-2 text-sm text-gray-600">{description}</p>

            <div className="mt-4 flex flex-wrap gap-3">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="rounded-lg border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        {link.label}
                    </Link>
                ))}
            </div>
        </div>
    );
}
