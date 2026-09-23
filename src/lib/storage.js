import { uploadData, remove, getUrl } from "aws-amplify/storage";
import { isStorageConfigured } from "@/lib/amplify";
import { getAuthenticatedUser } from "@/lib/auth";

const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024;

function sanitizeFileName(fileName) {
    const cleaned = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    return cleaned.slice(-100) || "logo";
}

function randomId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function validateLogoFile(file) {
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
        throw new Error("Logo must be a PNG, JPEG, or WebP image.");
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
        throw new Error("Logo must be smaller than 5MB.");
    }
}

/**
 * Uploads a logo to a Cognito-sub-scoped S3 prefix using Amplify Storage
 * (Identity Pool credentials — no static AWS keys in the browser). The key
 * is intentionally built from the same Cognito User Pool `sub` that the
 * createOrganization resolver reads from `ctx.identity.sub`, so the
 * resolver can validate the key actually belongs to the caller before
 * associating it with a new organization.
 */
export async function uploadOrganizationLogo(file) {
    if (!isStorageConfigured()) {
        throw new Error(
            "Logo upload isn't configured yet. You can create your organization without a logo and add one later."
        );
    }

    validateLogoFile(file);

    const user = await getAuthenticatedUser();

    if (!user?.userId) {
        throw new Error("You must be signed in to upload a logo.");
    }

    const path = `temporary/organizations/${user.userId}/${randomId()}/${sanitizeFileName(file.name || "logo")}`;

    try {
        const uploadTask = uploadData({
            path,
            data: file,
            options: {
                contentType: file.type,
            },
        });

        const result = await uploadTask.result;
        return result.path;
    } catch (error) {
        console.error("Logo upload failed:", error);
        throw new Error("Unable to upload logo. Please try again.");
    }
}

/**
 * Best-effort cleanup for a logo that was uploaded but never got attached
 * to an organization (e.g. createOrganization failed afterward). Failures
 * here are logged, not thrown — losing a stray temp object is not worth
 * blocking the user-facing error flow over.
 */
export async function deleteUploadedLogo(logoKey) {
    if (!logoKey || !isStorageConfigured()) {
        return false;
    }

    try {
        await remove({
            path: logoKey,
        });

        return true;
    } catch (error) {
        console.error("Failed to clean up uploaded logo:", {
            logoKey,
            name: error?.name,
            message: error?.message,
            code: error?.code,
            error,
        });

        return false;
    }
}

export async function getOrganizationLogoUrl(logoKey) {
    if (!logoKey || !isStorageConfigured()) {
        return null;
    }

    try {
        const result = await getUrl({ path: logoKey });
        return result.url.toString();
    } catch (error) {
        console.error("Failed to resolve logo URL:", error);
        return null;
    }
}
