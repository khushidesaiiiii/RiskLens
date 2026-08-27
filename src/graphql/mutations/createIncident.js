export const CREATE_INCIDENT = `
  mutation CreateIncident($input: CreateIncidentInput!) {
    createIncident(input: $input) {
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