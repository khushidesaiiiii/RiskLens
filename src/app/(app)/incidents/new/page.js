"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createIncident } from "@/lib/incidents";

export default function NewIncidentPage() {
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [severity, setSeverity] = useState("LOW");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    async function handleSubmit(event) {
        event.preventDefault();

        setIsSubmitting(true);
        setError(null);

        try {
            const incident = await createIncident({
                title,
                description,
                location,
                severity,
            });

            router.push(`/incidents/${incident.id}`);
        } catch (err) {
            console.error("Failed to create incident:", err);
            setError(err.message);
            setIsSubmitting(false);
        }
    }

    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-3xl">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Report Incident
                    </h1>

                    <p className="mt-2 text-gray-600">
                        Provide details about the incident.
                    </p>
                </div>

                {error && (
                    <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
                        {error}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="mt-8 space-y-6 rounded-xl border bg-white p-8 shadow-sm"
                >
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Incident title
                        </label>

                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="e.g. Forklift collision"
                            className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Description
                        </label>

                        <textarea
                            rows={6}
                            required
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder="Describe what happened..."
                            className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Location
                        </label>

                        <input
                            type="text"
                            required
                            value={location}
                            onChange={(event) => setLocation(event.target.value)}
                            placeholder="e.g. Warehouse A"
                            className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Severity
                        </label>

                        <select
                            value={severity}
                            onChange={(event) => setSeverity(event.target.value)}
                            className="mt-2 w-full rounded-lg border px-4 py-3"
                        >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="CRITICAL">Critical</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                        {isSubmitting ? "Submitting..." : "Submit Incident"}
                    </button>
                </form>
            </div>
        </main>
    );
}
