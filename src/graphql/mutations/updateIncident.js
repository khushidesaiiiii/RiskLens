export const UPDATE_INCIDENT = `
  mutation UpdateIncident($id: ID!, $input: UpdateIncidentInput!) {
    updateIncident(id: $id, input: $input) {
      id
      organizationId
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
