export const GET_MY_ORGANIZATION = `
  query GetMyOrganization {
    myOrganization {
      role
      organization {
        id
        name
        createdAt
        updatedAt
      }
    }
  }
`;
