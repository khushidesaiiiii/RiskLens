"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getIncidents } from "@/lib/incidents";

const PAGE_SIZE = 20;

export default function IncidentsPage() {
    const [incidents, setIncidents] = useState([]);
    const [nextToken, setNextToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function loadFirstPage() {
            setIsLoading(true);
            setError(null);

            try {
                const result = await getIncidents({
                    limit: PAGE_SIZE,
                    nextToken: null,
                });

                if (cancelled) return;

                setIncidents(result.items);
                setNextToken(result.nextToken);
            } catch (err) {
                if (cancelled) return;

                console.error("Failed to load incidents:", err);
                setError(err.message);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        loadFirstPage();

        return () => {
            cancelled = true;
        };
    }, []);

    async function handleLoadMore() {
        setIsLoadingMore(true);
        setError(null);

        try {
            const result = await getIncidents({
                limit: PAGE_SIZE,
                nextToken,
            });

            setIncidents((prev) => [...prev, ...result.items]);
            setNextToken(result.nextToken);
        } catch (err) {
            console.error("Failed to load more incidents:", err);
            setError(err.message);
        } finally {
            setIsLoadingMore(false);
        }
    }

    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-7xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Incidents
                        </h1>

                        <p className="mt-2 text-gray-600">
                            View and manage reported incidents.
                        </p>
                    </div>

                    <Link
                        href="/incidents/new"
                        className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800"
                    >
                        + Create Incident
                    </Link>
                </div>

                {error && (
                    <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
                        {error}
                    </div>
                )}

                {isLoading && (
                    <div className="mt-8 rounded-xl border bg-white p-12 text-center text-gray-500">
                        Loading incidents...
                    </div>
                )}

                {!isLoading && !error && incidents.length === 0 && (
                    <div className="mt-8 rounded-xl border bg-white p-12 text-center">
                        <h2 className="text-lg font-semibold text-gray-900">
                            No incidents yet
                        </h2>

                        <p className="mt-2 text-gray-500">
                            Create your first incident to get started.
                        </p>

                        <Link
                            href="/incidents/new"
                            className="mt-6 inline-block rounded-lg bg-black px-5 py-3 text-sm font-medium text-white"
                        >
                            Create Incident
                        </Link>
                    </div>
                )}

                {!isLoading && incidents.length > 0 && (
                    <div className="mt-8 space-y-4">
                        {incidents.map((incident) => (
                            <Link
                                key={incident.id}
                                href={`/incidents/${incident.id}`}
                                className="block rounded-xl border bg-white p-6 shadow-sm transition hover:border-gray-400"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        {incident.title}
                                    </h2>

                                    <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                                        {incident.severity}
                                    </span>
                                </div>

                                <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                                    {incident.description}
                                </p>

                                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                    <span>{incident.location}</span>
                                    <span>Status: {incident.status}</span>
                                    <span>
                                        {new Date(incident.createdAt).toLocaleString()}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {!isLoading && nextToken && (
                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={handleLoadMore}
                            disabled={isLoadingMore}
                            className="rounded-lg border bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            {isLoadingMore ? "Loading..." : "Load More"}
                        </button>
                    </div>
                )}

                {!isLoading && !nextToken && incidents.length > 0 && (
                    <p className="mt-6 text-center text-sm text-gray-400">
                        No more incidents.
                    </p>
                )}
            </div>
        </main>
    );
}
