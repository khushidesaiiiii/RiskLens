export const UPDATE_ORGANIZATION = /* GraphQL */ `
    mutation UpdateOrganization($input: UpdateOrganizationInput!) {
        updateOrganization(input: $input) {
            id
            name
            email
            address
            street
            state
            country
            logoKey
            createdAt
            updatedAt
        }
    }
`;