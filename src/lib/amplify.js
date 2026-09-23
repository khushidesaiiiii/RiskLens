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

    // Identity Pool + S3 are optional: only needed for organization logo
    // uploads (src/lib/storage.js). Login/AppSync must keep working even
    // if these haven't been set up yet — see isStorageConfigured().
    const identityPoolId = process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID;
    const s3Bucket = process.env.NEXT_PUBLIC_S3_BUCKET_NAME;
    const s3Region = process.env.NEXT_PUBLIC_S3_REGION;

    const amplifyConfig = {
        Auth: {
            Cognito: {
                userPoolId,
                userPoolClientId,
                loginWith: {
                    email: true,
                },
                ...(identityPoolId ? { identityPoolId } : {}),
            },
        },
    };

    if (identityPoolId && s3Bucket && s3Region) {
        amplifyConfig.Storage = {
            S3: {
                bucket: s3Bucket,
                region: s3Region,
            },
        };
    }

    Amplify.configure(amplifyConfig);

    configured = true;
}

export function isStorageConfigured() {
    return Boolean(
        process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID &&
        process.env.NEXT_PUBLIC_S3_BUCKET_NAME &&
        process.env.NEXT_PUBLIC_S3_REGION
    );
}