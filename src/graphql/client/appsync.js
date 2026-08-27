const APPSYNC_URL = process.env.NEXT_PUBLIC_APPSYNC_URL;
const APPSYNC_API_KEY = process.env.NEXT_PUBLIC_APPSYNC_API_KEY;

function assertConfigured() {
    if (!APPSYNC_URL) {
        throw new Error(
            "Missing NEXT_PUBLIC_APPSYNC_URL environment variable. Set it in .env.local to your AppSync GraphQL endpoint URL."
        );
    }

    if (!APPSYNC_API_KEY) {
        throw new Error(
            "Missing NEXT_PUBLIC_APPSYNC_API_KEY environment variable. Set it in .env.local to a valid AppSync API key."
        );
    }
}

export async function executeGraphQL(query, variables = {}) {
    assertConfigured();

    let response;

    try {
        response = await fetch(APPSYNC_URL, {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "x-api-key": APPSYNC_API_KEY,
            },

            body: JSON.stringify({
                query,
                variables,
            }),
        });
    } catch (networkError) {
        console.error("AppSync network error:", networkError);

        throw new Error(
            "Unable to reach AppSync. Check your network connection and NEXT_PUBLIC_APPSYNC_URL."
        );
    }

    let result;

    try {
        result = await response.json();
    } catch (parseError) {
        console.error("AppSync response parse error:", parseError);

        throw new Error("Received an invalid response from AppSync.");
    }

    if (!response.ok) {
        console.error("AppSync HTTP error:", response.status, result);

        throw new Error(
            result?.errors?.[0]?.message ||
            `AppSync request failed with status ${response.status}`
        );
    }

    if (result.errors?.length) {
        console.error("AppSync GraphQL errors:", result.errors);

        throw new Error(
            result.errors[0].message ||
            "GraphQL operation failed"
        );
    }

    return result.data;
}