import {
    getCurrentUser,
    signIn,
    signOut,
    fetchAuthSession,
    signUp as amplifySignUp,
    confirmSignUp as amplifyConfirmSignUp,
    resendSignUpCode as amplifyResendSignUpCode,
} from "aws-amplify/auth";

function friendlyAuthError(error, fallback) {
    switch (error?.name) {
        case "UsernameExistsException":
            return "An account with this email already exists.";
        case "InvalidPasswordException":
            return "Password does not meet the required complexity rules.";
        case "InvalidParameterException":
            return "Please check your email and password and try again.";
        case "CodeMismatchException":
            return "That verification code is incorrect.";
        case "ExpiredCodeException":
            return "That verification code has expired. Request a new one.";
        case "NotAuthorizedException":
            return "This account is already confirmed. Try signing in instead.";
        case "UserNotFoundException":
            return "We couldn't find an account with that email.";
        case "LimitExceededException":
        case "TooManyRequestsException":
            return "Too many attempts. Please wait a moment and try again.";
        default:
            return error?.message || fallback;
    }
}

export async function signUp(email, password) {
    try {
        return await amplifySignUp({
            username: email,
            password,
            options: {
                userAttributes: {
                    email,
                },
            },
        });
    } catch (error) {
        console.error("Cognito signUp failed:", error);
        throw new Error(friendlyAuthError(error, "Unable to create your account."));
    }
}

export async function confirmSignUp(email, confirmationCode) {
    try {
        return await amplifyConfirmSignUp({
            username: email,
            confirmationCode,
        });
    } catch (error) {
        console.error("Cognito confirmSignUp failed:", error);
        throw new Error(friendlyAuthError(error, "Unable to verify your email."));
    }
}

export async function resendSignUpCode(email) {
    try {
        return await amplifyResendSignUpCode({ username: email });
    } catch (error) {
        console.error("Cognito resendSignUpCode failed:", error);
        throw new Error(friendlyAuthError(error, "Unable to resend the verification code."));
    }
}

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