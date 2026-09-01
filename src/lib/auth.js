import {
    getCurrentUser,
    signIn,
    signOut,
    fetchAuthSession,
} from "aws-amplify/auth";

// export async function login(email, password) {
//     const result = await signIn({
//         username: email,
//         password,
//     });

//     if (!result.isSignedIn) {
//         return result;
//     }

//     const session = await fetchAuthSession();

//     if (!session.tokens?.accessToken) {
//         throw new Error(
//             "Authentication succeeded, but no Cognito session was established."
//         );
//     }

//     return result;
// }
export async function login(email, password) {
    const result = await signIn({
        username: email,
        password,
    });

    console.log("Cognito signIn result:", {
        isSignedIn: result.isSignedIn,
        nextStep: result.nextStep,
    });

    if (!result.isSignedIn) {
        return result;
    }

    const session = await fetchAuthSession();

    if (!session.tokens?.accessToken) {
        throw new Error(
            "Authentication succeeded, but no Cognito session was established."
        );
    }

    return result;
}
export async function logout() {
    await signOut();
}

export async function getAuthenticatedUser() {
    try {
        return await getCurrentUser();
    } catch {
        return null;
    }
}

export async function getAuthSession() {
    return await fetchAuthSession();
}