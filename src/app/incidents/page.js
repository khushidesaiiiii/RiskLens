import Link from "next/link";

export default function IncidentsPage() {
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
            </div>
        </main>
    );
}