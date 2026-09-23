export const CREATE_ORGANIZATION = `
  mutation CreateOrganization($input: CreateOrganizationInput!) {
    createOrganization(input: $input) {
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
