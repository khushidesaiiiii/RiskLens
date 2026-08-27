import { executeGraphQL } from "@/graphql/client/appsync";
import { GET_INCIDENTS } from "@/graphql/queries/incidents";
import { GET_INCIDENT } from "@/graphql/queries/incident";
import { CREATE_INCIDENT } from "@/graphql/mutations/createIncident";

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
