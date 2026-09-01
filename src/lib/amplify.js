import { Amplify } from "aws-amplify";

let configured = false;

export function configureAmplify() {
    if (configured) {
        return;
    }

    const userPoolId =
        process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;

    const userPoolClientId =
        process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

    const region =
        process.env.NEXT_PUBLIC_COGNITO_REGION;

    if (!userPoolId) {
        throw new Error(
            "NEXT_PUBLIC_COGNITO_USER_POOL_ID is not configured"
        );
    }

    if (!userPoolClientId) {
        throw new Error(
            "NEXT_PUBLIC_COGNITO_CLIENT_ID is not configured"
        );
    }

    if (!region) {
        throw new Error(
            "NEXT_PUBLIC_COGNITO_REGION is not configured"
        );
    }

    Amplify.configure({
        Auth: {
            Cognito: {
                userPoolId,
                userPoolClientId,
                loginWith: {
                    email: true,
                },
            },
        },
    });

    configured = true;
}