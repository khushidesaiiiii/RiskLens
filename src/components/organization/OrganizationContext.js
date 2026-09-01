"use client";

import { createContext, useContext } from "react";

/**
 * Exposes the caller's current organization to the authenticated app
 * (Dashboard, Incidents, future modules) without prop-drilling or
 * re-querying myOrganization() from every page.
 *
 * Shaped for a single current organization today (this project is
 * one-organization-per-user, enforced server-side — see
 * CLAUDE.md -> Multi-Tenancy Rules), but deliberately named/structured
 * so a future org switcher can extend this value (e.g. add
 * `organizations`/`switchOrganization`) without changing how
 * `organization`/`role`/`refresh` are consumed here.
 */
const OrganizationContext = createContext(null);

export function OrganizationProvider({ value, children }) {
    return (
        <OrganizationContext.Provider value={value}>
            {children}
        </OrganizationContext.Provider>
    );
}

export function useOrganization() {
    const context = useContext(OrganizationContext);

    if (!context) {
        throw new Error(
            "useOrganization() must be used within an OrganizationProvider"
        );
    }

    return context;
}
