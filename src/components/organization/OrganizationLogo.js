"use client";

import { useEffect, useState } from "react";
import { getOrganizationLogoUrl } from "@/lib/storage";

export default function OrganizationLogo({ name, logoKey, size = 32 }) {
    const [logoUrl, setLogoUrl] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function resolveLogoUrl() {
            const url = logoKey ? await getOrganizationLogoUrl(logoKey) : null;

            if (!cancelled) {
                setLogoUrl(url);
            }
        }

        resolveLogoUrl();

        return () => {
            cancelled = true;
        };
    }, [logoKey]);

    const dimension = `${size}px`;

    if (logoUrl) {
        return (
            <img
                src={logoUrl}
                alt={`${name || "Organization"} logo`}
                style={{ width: dimension, height: dimension }}
                className="rounded-full object-cover"
            />
        );
    }

    const initial = name?.trim()?.charAt(0)?.toUpperCase() || "?";

    return (
        <div
            style={{ width: dimension, height: dimension }}
            className="flex items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white"
        >
            {initial}
        </div>
    );
}
