"use client";

import { useOrganization } from "@/components/organization/OrganizationContext";
import OrganizationDetailsForm from "@/components/organization/OrganizationDetailsForm";

export default function OrganizationPage() {
    const { organization, role, refresh } = useOrganization();

    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-3xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Organization
                        </h1>

                        <p className="mt-2 text-gray-600">
                            Manage your organization&apos;s details
                            {role ? ` (your role: ${role.toLowerCase()})` : ""}
                            .
                        </p>
                    </div>

                    <button
                        type="button"
                        disabled
                        title="Multiple organizations aren't supported yet"
                        className="cursor-not-allowed whitespace-nowrap rounded-lg border px-4 py-2 text-sm text-gray-400"
                    >
                        + Create new organization
                    </button>
                </div>

                <div className="mt-8">
                    {organization && (
                        <OrganizationDetailsForm
                            organization={organization}
                            onUpdated={refresh}
                        />
                    )}
                </div>
            </div>
        </main>
    );
}
