import {
    getCurrentUser,
    signIn,
    signOut,
    fetchAuthSession,
} from "aws-amplify/auth";

export async function login(email, password) {
    const result = await signIn({
        username: email,
        password,
    });

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