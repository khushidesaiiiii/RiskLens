export const GET_INCIDENT = `
  query GetIncident($id: ID!) {
    incident(id: $id) {
      id
      title
      description
      location
      severity
      status
      createdAt
      updatedAt
    }
  }
`;
