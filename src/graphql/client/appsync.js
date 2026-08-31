import { getAuthSession } from "@/lib/auth";

const APPSYNC_URL = process.env.NEXT_PUBLIC_APPSYNC_URL;

function assertConfigured() {
    if (!APPSYNC_URL) {
        throw new Error(
            "Missing NEXT_PUBLIC_APPSYNC_URL environment variable. Set it in .env.local to your AppSync GraphQL endpoint URL."
        );
    }
}

async function getIdToken() {
    let session;

    try {
        session = await getAuthSession();
    } catch (sessionError) {
        console.error("AppSync auth session error:", sessionError);

        throw new Error(
            "Unable to read the Cognito auth session. Make sure Amplify is configured."
        );
    }

    const idToken = session?.tokens?.idToken?.toString();

    if (!idToken) {
        throw new Error("No authenticated Cognito session found");
    }

    return idToken;
}

export async function executeGraphQL(query, variables = {}) {
    assertConfigured();

    const idToken = await getIdToken();

    let response;

    try {
        response = await fetch(APPSYNC_URL, {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                Authorization: idToken,
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
