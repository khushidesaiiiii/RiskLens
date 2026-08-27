export default function NewIncidentPage() {
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

                <form className="mt-8 space-y-6 rounded-xl border bg-white p-8 shadow-sm">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Incident title
                        </label>

                        <input
                            type="text"
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
                            placeholder="e.g. Warehouse A"
                            className="mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Severity
                        </label>

                        <select className="mt-2 w-full rounded-lg border px-4 py-3">
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="CRITICAL">Critical</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800"
                    >
                        Submit Incident
                    </button>
                </form>
            </div>
        </main>
    );
}