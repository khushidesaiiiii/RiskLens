"use client";

import { useState } from "react";

import { updateIncident } from "@/lib/incidents";

const SEVERITY_OPTIONS = [
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
    { value: "CRITICAL", label: "Critical" },
];

const EDITABLE_FIELDS = ["title", "description", "location", "severity"];

const FIELD_CLASSNAME =
    "mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-black disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500";

export default function IncidentEditForm({ incident, onSaved, onCancel }) {
    const [fields, setFields] = useState({
        title: incident.title,
        description: incident.description,
        location: incident.location,
        severity: incident.severity,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    // Keep a legacy/unknown severity selectable instead of silently
    // switching it to the first option.
    const severityOptions = SEVERITY_OPTIONS.some(
        (option) => option.value === incident.severity
    )
        ? SEVERITY_OPTIONS
        : [
              { value: incident.severity, label: incident.severity },
              ...SEVERITY_OPTIONS,
          ];

    function updateField(field) {
        return (event) => {
            setFields((current) => ({
                ...current,
                [field]: event.target.value,
            }));
        };
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (isSaving) {
            return;
        }

        setError(null);

        const trimmed = {
            title: fields.title.trim(),
            description: fields.description.trim(),
            location: fields.location.trim(),
            severity: fields.severity,
        };

        if (
            !trimmed.title ||
            !trimmed.description ||
            !trimmed.location ||
            !trimmed.severity
        ) {
            setError("Title, description, location, and severity are required.");
            return;
        }

        // Only send fields that actually changed.
        const changes = Object.fromEntries(
            EDITABLE_FIELDS.filter(
                (field) => trimmed[field] !== incident[field]
            ).map((field) => [field, trimmed[field]])
        );

        if (Object.keys(changes).length === 0) {
            onCancel();
            return;
        }

        setIsSaving(true);

        try {
            const updated = await updateIncident({
                id: incident.id,
                ...changes,
            });

            onSaved(updated);
        } catch (err) {
            console.error("Failed to update incident:", err);
            setError(err.message);
            setIsSaving(false);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-6 rounded-xl border bg-white p-8 shadow-sm"
        >
            <h1 className="text-2xl font-bold text-gray-900">Edit Incident</h1>

            {error && (
                <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
                    {error}
                </div>
            )}

            <div>
                <label
                    htmlFor="incidentTitle"
                    className="block text-sm font-medium text-gray-700"
                >
                    Incident title
                </label>

                <input
                    id="incidentTitle"
                    type="text"
                    required
                    disabled={isSaving}
                    value={fields.title}
                    onChange={updateField("title")}
                    className={FIELD_CLASSNAME}
                />
            </div>

            <div>
                <label
                    htmlFor="incidentDescription"
                    className="block text-sm font-medium text-gray-700"
                >
                    Description
                </label>

                <textarea
                    id="incidentDescription"
                    rows={6}
                    required
                    disabled={isSaving}
                    value={fields.description}
                    onChange={updateField("description")}
                    className={FIELD_CLASSNAME}
                />
            </div>

            <div>
                <label
                    htmlFor="incidentLocation"
                    className="block text-sm font-medium text-gray-700"
                >
                    Location
                </label>

                <input
                    id="incidentLocation"
                    type="text"
                    required
                    disabled={isSaving}
                    value={fields.location}
                    onChange={updateField("location")}
                    className={FIELD_CLASSNAME}
                />
            </div>

            <div>
                <label
                    htmlFor="incidentSeverity"
                    className="block text-sm font-medium text-gray-700"
                >
                    Severity
                </label>

                <select
                    id="incidentSeverity"
                    required
                    disabled={isSaving}
                    value={fields.severity}
                    onChange={updateField("severity")}
                    className={FIELD_CLASSNAME}
                >
                    {severityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSaving}
                    className="w-full rounded-lg border px-5 py-3 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                    {isSaving ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </form>
    );
}
