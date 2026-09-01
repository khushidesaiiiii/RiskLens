export const UPDATE_ORGANIZATION = `
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
