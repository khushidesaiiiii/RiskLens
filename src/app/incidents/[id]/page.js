"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { getIncident } from "@/lib/incidents";

export default function IncidentDetailPage() {
    const { id } = useParams();

    const [incident, setIncident] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) return;

        let cancelled = false;

        async function loadIncident() {
            setIsLoading(true);
            setError(null);

            try {
                const result = await getIncident(id);

                if (cancelled) return;

                setIncident(result);
            } catch (err) {
                if (cancelled) return;

                console.error("Failed to load incident:", err);
                setError(err.message);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        loadIncident();

        return () => {
            cancelled = true;
        };
    }, [id]);

    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-3xl">
                <Link
                    href="/incidents"
                    className="text-sm text-gray-600 hover:text-gray-900"
                >
                    ← Back to Incidents
                </Link>

                {isLoading && (
                    <div className="mt-6 rounded-xl border bg-white p-12 text-center text-gray-500">
                        Loading incident...
                    </div>
                )}

                {!isLoading && error && (
                    <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
                        {error}
                    </div>
                )}

                {!isLoading && !error && !incident && (
                    <div className="mt-6 rounded-xl border bg-white p-12 text-center">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Incident not found
                        </h2>

                        <p className="mt-2 text-gray-500">
                            This incident may have been removed, or the link is
                            incorrect.
                        </p>
                    </div>
                )}

                {!isLoading && !error && incident && (
                    <div className="mt-6 rounded-xl border bg-white p-8 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                            <h1 className="text-2xl font-bold text-gray-900">
                                {incident.title}
                            </h1>

                            <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                                {incident.severity}
                            </span>
                        </div>

                        <p className="mt-4 whitespace-pre-wrap text-gray-700">
                            {incident.description}
                        </p>

                        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <dt className="text-gray-500">Location</dt>
                                <dd className="mt-1 text-gray-900">
                                    {incident.location}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-gray-500">Status</dt>
                                <dd className="mt-1 text-gray-900">
                                    {incident.status}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-gray-500">Created</dt>
                                <dd className="mt-1 text-gray-900">
                                    {new Date(incident.createdAt).toLocaleString()}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-gray-500">Updated</dt>
                                <dd className="mt-1 text-gray-900">
                                    {new Date(incident.updatedAt).toLocaleString()}
                                </dd>
                            </div>
                        </dl>
                    </div>
                )}
            </div>
        </main>
    );
}
