export const CREATE_ORGANIZATION = `
  mutation CreateOrganization($input: CreateOrganizationInput!) {
    createOrganization(input: $input) {
      id
      name
      createdAt
      updatedAt
    }
  }
`;
