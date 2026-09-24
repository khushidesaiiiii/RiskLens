import { executeGraphQL } from "@/graphql/client/appsync";
import { GET_INCIDENTS } from "@/graphql/queries/incidents";
import { GET_INCIDENT } from "@/graphql/queries/incident";
import { CREATE_INCIDENT } from "@/graphql/mutations/createIncident";
import { UPDATE_INCIDENT } from "@/graphql/mutations/updateIncident";

export async function getIncidents({ limit = 20, nextToken = null } = {}) {
    const data = await executeGraphQL(GET_INCIDENTS, {
        limit,
        nextToken,
    });

    return data.incidents;
}

export async function getIncident(id) {
    const data = await executeGraphQL(GET_INCIDENT, {
        id,
    });

    return data.incident;
}

export async function createIncident(input) {
    const data = await executeGraphQL(CREATE_INCIDENT, {
        input,
    });

    return data.createIncident;
}

// Partial update: only the fields passed (not undefined) are sent.
// organizationId is never sent — AppSync resolves the caller's
// organization from their Cognito identity. status is not editable here.
export async function updateIncident({
    id,
    title,
    description,
    location,
    severity,
}) {
    const input = Object.fromEntries(
        Object.entries({ title, description, location, severity }).filter(
            ([, value]) => value !== undefined
        )
    );

    const data = await executeGraphQL(UPDATE_INCIDENT, {
        id,
        input,
    });

    return data.updateIncident;
}
