import { executeGraphQL } from "@/graphql/client/appsync";
import { GET_MY_ORGANIZATION } from "@/graphql/queries/organization";
import { CREATE_ORGANIZATION } from "@/graphql/mutations/createOrganization";
import { UPDATE_ORGANIZATION } from "@/graphql/mutations/updateOrganization";

export async function getMyOrganization() {
    const data = await executeGraphQL(GET_MY_ORGANIZATION);

    return data.myOrganization;
}

export async function createOrganization({
    name,
    email,
    address,
    street,
    state,
    country,
    logoKey,
}) {
    const data = await executeGraphQL(CREATE_ORGANIZATION, {
        input: {
            name,
            email,
            address,
            street,
            state,
            country,
            ...(logoKey ? { logoKey } : {}),
        },
    });

    return data.createOrganization;
}

export async function updateOrganization({
    name,
    email,
    address,
    street,
    state,
    country,
    logoKey,
}) {
    const data = await executeGraphQL(UPDATE_ORGANIZATION, {
        input: {
            name,
            email,
            address,
            street,
            state,
            country,
            ...(logoKey !== undefined ? { logoKey } : {}),
        },
    });

    return data.updateOrganization;
}
