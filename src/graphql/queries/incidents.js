export const GET_INCIDENTS = `
  query GetIncidents($limit: Int, $nextToken: String) {
    incidents(
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        title
        description
        location
        severity
        status
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;