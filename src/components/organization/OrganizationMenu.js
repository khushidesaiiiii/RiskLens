"use client";

import { useRef } from "react";
import Link from "next/link";
import OrganizationLogo from "@/components/organization/OrganizationLogo";

export default function OrganizationMenu({ organization }) {
    const detailsRef = useRef(null);

    function closeMenu() {
        if (detailsRef.current) {
            detailsRef.current.open = false;
        }
    }

    return (
        <details ref={detailsRef} className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
                {organization && (
                    <>
                        <OrganizationLogo
                            name={organization.name}
                            logoKey={organization.logoKey}
                            size={24}
                        />
                        <span className="text-sm text-gray-700">
                            {organization.name}
                        </span>
                    </>
                )}

                <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4 text-gray-400"
                    aria-hidden="true"
                >
                    <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                        clipRule="evenodd"
                    />
                </svg>
            </summary>

            <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border bg-white py-1 shadow-lg">
                <Link
                    href="/account"
                    onClick={closeMenu}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                    My Account
                </Link>

                <Link
                    href="/organization"
                    onClick={closeMenu}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                    Organization
                </Link>
            </div>
        </details>
    );
}
