"use client";

import { useState } from "react";
import { createOrganization } from "@/lib/organization";
import {
    uploadOrganizationLogo,
    deleteUploadedLogo,
    validateLogoFile,
} from "@/lib/storage";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY_FIELDS = {
    name: "",
    email: "",
    address: "",
    street: "",
    state: "",
    country: "",
};

export default function OrganizationOnboardingForm({ onSuccess }) {
    const [fields, setFields] = useState(EMPTY_FIELDS);
    const [submitError, setSubmitError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [logoFile, setLogoFile] = useState(null);
    const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);
    const [logoKey, setLogoKey] = useState(null);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [logoError, setLogoError] = useState(null);

    function updateField(field) {
        return (event) => {
            setFields((current) => ({
                ...current,
                [field]: event.target.value,
            }));
        };
    }

    async function handleLogoChange(event) {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file) {
            return;
        }

        setLogoError(null);

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
        const keyToRemove = logoKey;

        setLogoFile(null);
        setLogoPreviewUrl(null);
        setLogoKey(null);
        setLogoError(null);

        if (keyToRemove) {
            await deleteUploadedLogo(keyToRemove);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSubmitError(null);

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
            setSubmitError("All fields except logo are required.");
            return;
        }

        if (!EMAIL_REGEX.test(trimmed.email)) {
            setSubmitError("Enter a valid organization email address.");
            return;
        }

        if (isUploadingLogo) {
            setSubmitError("Please wait for the logo upload to finish.");
            return;
        }

        setIsSubmitting(true);

        try {
            const organization = await createOrganization({
                ...trimmed,
                logoKey: logoKey || undefined,
            });

            onSuccess(organization);
        } catch (createError) {
            console.error("Failed to create organization:", createError);
            setSubmitError(createError.message);

            if (logoKey) {
                await deleteUploadedLogo(logoKey);
                setLogoKey(null);
                setLogoFile(null);
                setLogoPreviewUrl(null);
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    const disabled = isSubmitting || isUploadingLogo;

    return (
        <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow-sm">
            <h1 className="text-lg font-semibold text-gray-900">
                Create your organization
            </h1>

            <p className="mt-2 text-sm text-gray-600">
                Your account isn&apos;t a member of any RiskLens
                organization yet. Create one to get started —
                you&apos;ll be its owner.
            </p>

            {submitError && (
                <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                    {submitError}
                </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                        value={fields.name}
                        onChange={updateField("name")}
                        placeholder="e.g. RiskLens Development"
                        className="mt-1 w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-black"
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
                        value={fields.email}
                        onChange={updateField("email")}
                        placeholder="org@example.com"
                        className="mt-1 w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-black"
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
                        value={fields.address}
                        onChange={updateField("address")}
                        className="mt-1 w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-black"
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
                        value={fields.street}
                        onChange={updateField("street")}
                        className="mt-1 w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-black"
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
                            value={fields.state}
                            onChange={updateField("state")}
                            className="mt-1 w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-black"
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
                            value={fields.country}
                            onChange={updateField("country")}
                            className="mt-1 w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>
                </div>

                <div>
                    <span className="block text-sm font-medium text-gray-700">
                        Organization logo (optional)
                    </span>

                    {logoError && (
                        <p className="mt-1 text-sm text-red-600">{logoError}</p>
                    )}

                    {logoPreviewUrl ? (
                        <div className="mt-2 flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={logoPreviewUrl}
                                alt="Logo preview"
                                className="h-12 w-12 rounded-full object-cover"
                            />

                            <div className="flex-1 text-sm text-gray-600">
                                {logoFile?.name}
                                {isUploadingLogo && (
                                    <span className="ml-2 text-gray-400">
                                        Uploading...
                                    </span>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={handleRemoveLogo}
                                disabled={isUploadingLogo}
                                className="text-sm text-gray-500 hover:underline disabled:opacity-50"
                            >
                                Remove
                            </button>
                        </div>
                    ) : (
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleLogoChange}
                            className="mt-2 block w-full text-sm text-gray-600"
                        />
                    )}
                </div>

                <button
                    type="submit"
                    disabled={disabled}
                    className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                    {isSubmitting ? "Creating..." : "Create Organization"}
                </button>
            </form>
        </div>
    );
}
