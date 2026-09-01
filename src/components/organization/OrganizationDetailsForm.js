"use client";

import { useState } from "react";
import { updateOrganization } from "@/lib/organization";
import {
    uploadOrganizationLogo,
    deleteUploadedLogo,
    validateLogoFile,
} from "@/lib/storage";
import OrganizationLogo from "@/components/organization/OrganizationLogo";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIELD_CLASSNAME =
    "mt-1 w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-black disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500";

export default function OrganizationDetailsForm({ organization, onUpdated }) {
    const [fields, setFields] = useState({
        name: organization.name,
        email: organization.email,
        address: organization.address,
        street: organization.street,
        state: organization.state,
        country: organization.country,
    });

    const [logoKey, setLogoKey] = useState(organization.logoKey || null);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [logoError, setLogoError] = useState(null);

    const [saveError, setSaveError] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    function updateField(field) {
        return (event) => {
            setSaveSuccess(false);
            setFields((current) => ({
                ...current,
                [field]: event.target.value,
            }));
        };
    }

    function handleEditClick() {
        setSaveError(null);
        setSaveSuccess(false);
        setIsEditing(true);
    }

    async function handleLogoChange(event) {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file) {
            return;
        }

        setLogoError(null);
        setSaveSuccess(false);

        try {
            validateLogoFile(file);
        } catch (validationError) {
            setLogoError(validationError.message);
            return;
        }

        setLogoFile(file);
        setLogoPreviewUrl(URL.createObjectURL(file));
        setIsUploadingLogo(true);

        try {
            const uploadedKey = await uploadOrganizationLogo(file);
            setLogoKey(uploadedKey);
        } catch (uploadError) {
            console.error("Logo upload failed:", uploadError);
            setLogoError(uploadError.message);
            setLogoFile(null);
            setLogoPreviewUrl(null);
        } finally {
            setIsUploadingLogo(false);
        }
    }

    async function handleRemoveLogo() {
        const keyToRemove = logoFile ? logoKey : null;

        setLogoFile(null);
        setLogoPreviewUrl(null);
        setLogoKey(null);
        setLogoError(null);
        setSaveSuccess(false);

        // Only clean up a not-yet-saved upload here. The organization's
        // previously-saved logo (if any) is only cleaned up after a
        // successful save, below — removing it here would delete the
        // live logo before the user has actually saved anything.
        if (keyToRemove) {
            await deleteUploadedLogo(keyToRemove);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!isEditing) {
            return;
        }

        setSaveError(null);
        setSaveSuccess(false);

        const trimmed = {
            name: fields.name.trim(),
            email: fields.email.trim(),
            address: fields.address.trim(),
            street: fields.street.trim(),
            state: fields.state.trim(),
            country: fields.country.trim(),
        };

        if (
            !trimmed.name ||
            !trimmed.email ||
            !trimmed.address ||
            !trimmed.street ||
            !trimmed.state ||
            !trimmed.country
        ) {
            setSaveError("All fields except logo are required.");
            return;
        }

        if (!EMAIL_REGEX.test(trimmed.email)) {
            setSaveError("Enter a valid organization email address.");
            return;
        }

        if (isUploadingLogo) {
            setSaveError("Please wait for the logo upload to finish.");
            return;
        }

        setIsSaving(true);

        try {
            await updateOrganization({
                ...trimmed,
                logoKey: logoKey || undefined,
            });

            const previousLogoKey = organization.logoKey;

            if (previousLogoKey && previousLogoKey !== logoKey) {
                await deleteUploadedLogo(previousLogoKey);
            }

            setFields(trimmed);
            setLogoFile(null);
            setLogoPreviewUrl(null);
            setSaveSuccess(true);
            setIsEditing(false);
            await onUpdated?.();
        } catch (updateError) {
            console.error("Failed to update organization:", updateError);
            setSaveError(updateError.message);
        } finally {
            setIsSaving(false);
        }
    }

    const fieldsDisabled = !isEditing || isSaving;
    const submitDisabled = isSaving || isUploadingLogo;

    return (
        <div className="rounded-lg border bg-white p-8 shadow-sm">
            {saveError && (
                <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                    {saveError}
                </div>
            )}

            {saveSuccess && (
                <div className="mb-4 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700">
                    Organization details saved.
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label
                        htmlFor="orgName"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Organization name
                    </label>
                    <input
                        id="orgName"
                        type="text"
                        required
                        disabled={fieldsDisabled}
                        value={fields.name}
                        onChange={updateField("name")}
                        className={FIELD_CLASSNAME}
                    />
                </div>

                <div>
                    <label
                        htmlFor="orgEmail"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Organization email
                    </label>
                    <input
                        id="orgEmail"
                        type="email"
                        required
                        disabled={fieldsDisabled}
                        value={fields.email}
                        onChange={updateField("email")}
                        className={FIELD_CLASSNAME}
                    />
                </div>

                <div>
                    <label
                        htmlFor="orgAddress"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Address
                    </label>
                    <input
                        id="orgAddress"
                        type="text"
                        required
                        disabled={fieldsDisabled}
                        value={fields.address}
                        onChange={updateField("address")}
                        className={FIELD_CLASSNAME}
                    />
                </div>

                <div>
                    <label
                        htmlFor="orgStreet"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Street
                    </label>
                    <input
                        id="orgStreet"
                        type="text"
                        required
                        disabled={fieldsDisabled}
                        value={fields.street}
                        onChange={updateField("street")}
                        className={FIELD_CLASSNAME}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label
                            htmlFor="orgState"
                            className="block text-sm font-medium text-gray-700"
                        >
                            State
                        </label>
                        <input
                            id="orgState"
                            type="text"
                            required
                            disabled={fieldsDisabled}
                            value={fields.state}
                            onChange={updateField("state")}
                            className={FIELD_CLASSNAME}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="orgCountry"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Country
                        </label>
                        <input
                            id="orgCountry"
                            type="text"
                            required
                            disabled={fieldsDisabled}
                            value={fields.country}
                            onChange={updateField("country")}
                            className={FIELD_CLASSNAME}
                        />
                    </div>
                </div>

                <div>
                    <span className="block text-sm font-medium text-gray-700">
                        Organization logo
                    </span>

                    {logoError && (
                        <p className="mt-1 text-sm text-red-600">{logoError}</p>
                    )}

                    <div className="mt-2 flex items-center gap-3">
                        {logoPreviewUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={logoPreviewUrl}
                                alt="Logo preview"
                                className="h-12 w-12 rounded-full object-cover"
                            />
                        ) : (
                            <OrganizationLogo
                                name={fields.name}
                                logoKey={logoKey}
                                size={48}
                            />
                        )}

                        <div className="flex-1 text-sm text-gray-600">
                            {logoFile?.name}
                            {isUploadingLogo && (
                                <span className="ml-2 text-gray-400">
                                    Uploading...
                                </span>
                            )}
                        </div>

                        {isEditing &&
                            (logoKey || logoFile ? (
                                <button
                                    type="button"
                                    onClick={handleRemoveLogo}
                                    disabled={isUploadingLogo || isSaving}
                                    className="text-sm text-gray-500 hover:underline disabled:opacity-50"
                                >
                                    Remove
                                </button>
                            ) : (
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={handleLogoChange}
                                    disabled={isSaving}
                                    className="block text-sm text-gray-600"
                                />
                            ))}
                    </div>
                </div>

                {isEditing ? (
                    <button
                        type="submit"
                        disabled={submitDisabled}
                        className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                        {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleEditClick}
                        className="w-full rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Edit Organization Details
                    </button>
                )}
            </form>
        </div>
    );
}
