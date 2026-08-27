export default function DashboardPage() {
    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-7xl">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        RiskLens
                    </h1>

                    <p className="mt-2 text-gray-600">
                        AI-powered risk and incident intelligence
                    </p>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-4">
                    <DashboardCard
                        title="Total Incidents"
                        value="0"
                    />

                    <DashboardCard
                        title="Open Incidents"
                        value="0"
                    />

                    <DashboardCard
                        title="High Risk"
                        value="0"
                    />

                    <DashboardCard
                        title="Resolved"
                        value="0"
                    />
                </div>
            </div>
        </main>
    );
}

function DashboardCard({ title, value }) {
    return (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
                {title}
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
                {value}
            </p>
        </div>
    );
}