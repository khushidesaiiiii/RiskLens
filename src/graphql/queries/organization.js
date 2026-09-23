export const GET_MY_ORGANIZATION = `
  query GetMyOrganization {
    myOrganization {
      role
      organization {
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
  }
`;
