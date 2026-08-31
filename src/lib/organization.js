import { executeGraphQL } from "@/graphql/client/appsync";
import { GET_MY_ORGANIZATION } from "@/graphql/queries/organization";
import { CREATE_ORGANIZATION } from "@/graphql/mutations/createOrganization";

export async function getMyOrganization() {
    const data = await executeGraphQL(GET_MY_ORGANIZATION);

    return data.myOrganization;
}

export async function createOrganization(name) {
    const data = await executeGraphQL(CREATE_ORGANIZATION, {
        input: { name },
    });

    return data.createOrganization;
}
