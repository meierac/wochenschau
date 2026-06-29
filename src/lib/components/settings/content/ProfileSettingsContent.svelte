<script lang="ts">
    import { getContext, onDestroy } from "svelte";
    import { profile } from "../../../stores/profile";
    import { mobileHeaderActions } from "../../../stores/mobilePageHeader";
    import type { UserProfile } from "../../../types";
    import Button from "../../Button.svelte";
    import Input from "../../Input.svelte";
    import {
        cloudAuth,
        signInWithPocketBase,
        createPocketBaseAccount,
        signOutFromPocketBase,
        resolveInitialTransferChoice,
    } from "../../../services/cloudSync";

    const isPage: boolean = getContext("settingsIsPage") ?? false;

    // ── Profile editing state ──────────────────────────────────────────
    let isEditing = false;
    let isSaving = false;
    let draft = {
        username: "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        shortBio: "",
    };
    let profileError = "";
    let profileSuccess = "";
    let isUploadingAvatar = false;

    $: currentProfile = $profile;

    function startEditing() {
        draft = {
            username: currentProfile.username,
            firstName: currentProfile.firstName,
            lastName: currentProfile.lastName,
            phoneNumber: currentProfile.phoneNumber,
            shortBio: currentProfile.shortBio,
        };
        profileError = "";
        profileSuccess = "";
        isEditing = true;
    }

    function cancelEditing() {
        isEditing = false;
        profileError = "";
        profileSuccess = "";
    }

    async function saveProfile() {
        isSaving = true;
        profileError = "";
        profileSuccess = "";
        try {
            await profile.saveToRemote({
                username: draft.username.trim(),
                firstName: draft.firstName.trim(),
                lastName: draft.lastName.trim(),
                phoneNumber: draft.phoneNumber.trim(),
                shortBio: draft.shortBio.trim(),
            });
            profileSuccess = "Profile saved.";
            isEditing = false;
        } catch (error) {
            profileError = toErrorMessage(error);
        } finally {
            isSaving = false;
        }
    }

    async function handleAvatarChange(e: Event) {
        const input = e.currentTarget as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        isUploadingAvatar = true;
        profileError = "";
        profileSuccess = "";

        try {
            await profile.uploadAvatar(file);
            profileSuccess = "Avatar updated.";
        } catch (error) {
            profileError = toErrorMessage(error);
        } finally {
            isUploadingAvatar = false;
            input.value = "";
        }
    }

    async function handleRemoveAvatar() {
        profileError = "";
        profileSuccess = "";
        isUploadingAvatar = true;

        try {
            await profile.removeAvatar();
            profileSuccess = "Avatar removed.";
        } catch (error) {
            profileError = toErrorMessage(error);
        } finally {
            isUploadingAvatar = false;
        }
    }

    function formatValue(value: string) {
        return value.trim() || "—";
    }

    // ── Initials fallback for avatar ───────────────────────────────────
    function getInitials(p: UserProfile): string {
        const first = p.firstName?.charAt(0) ?? "";
        const last = p.lastName?.charAt(0) ?? "";
        if (first || last) return (first + last).toUpperCase();
        if (p.username) return p.username.charAt(0).toUpperCase();
        if (p.email) return p.email.charAt(0).toUpperCase();
        return "?";
    }

    // ── Auth state ─────────────────────────────────────────────────────
    let authMode: "login" | "register" = "login";
    let authEmail = "";
    let authPassword = "";
    let authPasswordConfirm = "";
    let authError = "";
    let authSuccess = "";

    function resetAuthMessages() {
        authError = "";
        authSuccess = "";
    }

    function toErrorMessage(error: unknown) {
        if (error instanceof Error) return error.message;
        return "Unknown error";
    }

    async function handleAuthSubmit() {
        resetAuthMessages();

        const email = authEmail.trim();
        if (!email || !authPassword) {
            authError = "Please enter email and password.";
            return;
        }

        try {
            if (authMode === "register") {
                if (authPassword !== authPasswordConfirm) {
                    authError = "Passwords do not match.";
                    return;
                }
                await createPocketBaseAccount(
                    email,
                    authPassword,
                    authPasswordConfirm,
                );
                authSuccess = "Account created. You are now signed in.";
            } else {
                await signInWithPocketBase(email, authPassword);
                authSuccess = "Signed in.";
            }
            authPassword = "";
            authPasswordConfirm = "";
        } catch (error) {
            authError = toErrorMessage(error);
        }
    }

    async function handleInitialTransferChoice(transfer: boolean) {
        resetAuthMessages();
        try {
            await resolveInitialTransferChoice(transfer);
            authSuccess = transfer
                ? "Local data transferred to your account."
                : "Using account data for this device.";
        } catch (error) {
            authError = toErrorMessage(error);
        }
    }

    function handleSignOut() {
        signOutFromPocketBase();
        authPassword = "";
        authPasswordConfirm = "";
        authSuccess = "Signed out.";
        authError = "";
        profileError = "";
        profileSuccess = "";
        isEditing = false;
    }

    // ── Mobile header actions ──────────────────────────────────────────
    $: if (isPage) {
        if (!$cloudAuth.isAuthenticated) {
            mobileHeaderActions.set([]);
        } else if (isEditing) {
            mobileHeaderActions.set([
                { label: "Cancel", onClick: cancelEditing, variant: "ghost" },
                { label: isSaving ? "Saving…" : "Save", onClick: saveProfile },
            ]);
        } else {
            mobileHeaderActions.set([{ label: "Edit", onClick: startEditing }]);
        }
    }

    onDestroy(() => {
        if (isPage) mobileHeaderActions.set([]);
    });
</script>

<div class="space-y-6">
    <!-- ── Inline header (non-page mode, authenticated) ────────────── -->
    {#if !isPage && $cloudAuth.isAuthenticated}
        <div class="flex flex-row items-center justify-between">
            {#if isEditing}
                <h3 class="text-lg font-semibold">Edit profile</h3>
                <div class="flex flex-row items-center gap-1">
                    <Button
                        variant="ghost"
                        class="rounded-full px-5"
                        on:click={cancelEditing}
                    >
                        Cancel
                    </Button>
                    <Button
                        class="rounded-full px-5"
                        on:click={saveProfile}
                        disabled={isSaving}
                    >
                        {isSaving ? "Saving…" : "Save"}
                    </Button>
                </div>
            {:else}
                <h3 class="text-lg font-semibold">Profile</h3>
                <Button class="rounded-full px-5" on:click={startEditing}>
                    Edit
                </Button>
            {/if}
        </div>
    {/if}

    <!-- ── Authenticated view ──────────────────────────────────────── -->
    {#if $cloudAuth.isAuthenticated}
        <!-- Profile section -->
        <section class="rounded-3xl border border-border bg-background/70 p-6">
            <!-- Avatar -->
            <div class="mt-4 flex flex-col items-center gap-2">
                <label
                    class="group relative block h-24 w-24 overflow-hidden rounded-full focus-within:outline-none focus-within:ring-2 focus-within:ring-ring {isUploadingAvatar
                        ? 'pointer-events-none opacity-70'
                        : 'cursor-pointer'}"
                    title="Change profile photo"
                    aria-label="Change profile photo"
                >
                    <input
                        type="file"
                        accept="image/*,.heic,.heif"
                        class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        disabled={isUploadingAvatar}
                        on:change={handleAvatarChange}
                    />
                    {#if currentProfile.profileImage}
                        <img
                            src={currentProfile.profileImage}
                            alt="Profile avatar"
                            class="h-24 w-24 rounded-full object-cover"
                        />
                    {:else}
                        <div
                            class="flex h-24 w-24 items-center justify-center rounded-full bg-muted text-2xl font-semibold text-muted-foreground"
                        >
                            {getInitials(currentProfile)}
                        </div>
                    {/if}
                    <div
                        class="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 {isUploadingAvatar
                            ? 'opacity-100'
                            : ''}"
                    >
                        {isUploadingAvatar ? "Uploading…" : "Change"}
                    </div>
                </label>
                {#if currentProfile.profileImage}
                    <button
                        type="button"
                        class="text-xs text-muted-foreground underline hover:text-destructive"
                        disabled={isUploadingAvatar}
                        on:click={handleRemoveAvatar}
                    >
                        Remove photo
                    </button>
                {/if}
            </div>

            <!-- Edit mode -->
            {#if isEditing}
                <div class="mt-6 grid gap-4 md:grid-cols-2">
                    <label class="flex flex-col gap-2 text-sm font-medium">
                        <span>Username</span>
                        <Input
                            bind:value={draft.username}
                            placeholder="Username"
                        />
                    </label>
                    <label class="flex flex-col gap-2 text-sm font-medium">
                        <span>First Name</span>
                        <Input
                            bind:value={draft.firstName}
                            placeholder="First Name"
                        />
                    </label>
                    <label class="flex flex-col gap-2 text-sm font-medium">
                        <span>Last Name</span>
                        <Input
                            bind:value={draft.lastName}
                            placeholder="Last Name"
                        />
                    </label>
                    <label class="flex flex-col gap-2 text-sm font-medium">
                        <span>Phone Number</span>
                        <Input
                            bind:value={draft.phoneNumber}
                            placeholder="Phone Number"
                        />
                    </label>
                    <label
                        class="flex flex-col gap-2 text-sm font-medium md:col-span-2"
                    >
                        <span>Short Bio</span>
                        <textarea
                            bind:value={draft.shortBio}
                            rows="5"
                            class="min-h-[132px] w-full resize-y rounded-lg border border-input bg-transparent px-4 py-3 text-base placeholder:text-muted-foreground transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            placeholder="Tell us a little about yourself"
                        ></textarea>
                    </label>
                </div>

                <!-- View mode -->
            {:else}
                <dl class="mt-6 grid gap-x-6 gap-y-5 md:grid-cols-2">
                    <div>
                        <dt
                            class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                            Role
                        </dt>
                        <dd class="mt-1 text-sm">Member</dd>
                    </div>
                    <div>
                        <dt
                            class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                            Username
                        </dt>
                        <dd class="mt-1 text-sm">
                            {formatValue(currentProfile.username)}
                        </dd>
                    </div>
                    <div>
                        <dt
                            class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                            First Name
                        </dt>
                        <dd class="mt-1 text-sm">
                            {formatValue(currentProfile.firstName)}
                        </dd>
                    </div>
                    <div>
                        <dt
                            class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                            Last Name
                        </dt>
                        <dd class="mt-1 text-sm">
                            {formatValue(currentProfile.lastName)}
                        </dd>
                    </div>
                    <div>
                        <dt
                            class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                            Email
                        </dt>
                        <dd class="mt-1 break-all text-sm">
                            {formatValue(currentProfile.email)}
                        </dd>
                    </div>
                    <div>
                        <dt
                            class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                            Phone Number
                        </dt>
                        <dd class="mt-1 text-sm">
                            {formatValue(currentProfile.phoneNumber)}
                        </dd>
                    </div>
                    <div class="md:col-span-2">
                        <dt
                            class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                            Bio
                        </dt>
                        <dd class="mt-1 whitespace-pre-wrap text-sm leading-6">
                            {formatValue(currentProfile.shortBio)}
                        </dd>
                    </div>
                </dl>
            {/if}
        </section>
        <!-- Account section -->
        <section class="rounded-3xl p-2">
            <div
                class="flex flex-col gap-3 md:pl-2 items-center md:justify-between"
            >
                <div>
                    <p class="text-sm text-muted-foreground">
                        Logged in as
                        <span class="font-medium"
                            >{$cloudAuth.email || "—"}</span
                        >
                    </p>
                </div>
                <Button
                    variant="secondary"
                    class="rounded-full px-5 w-full"
                    on:click={handleSignOut}
                >
                    Logout
                </Button>
            </div>

            {#if $cloudAuth.requiresInitialTransferChoice}
                <div
                    class="mt-4 rounded-2xl border border-border/60 bg-background/70 p-4 text-sm"
                >
                    <p class="font-medium">Transfer local data?</p>
                    <p class="mt-1 text-muted-foreground">
                        We found local data on this device. Do you want to
                        transfer it to this account?
                    </p>
                    <div class="mt-3 flex flex-wrap gap-2">
                        <Button
                            class="rounded-full px-5"
                            on:click={() => handleInitialTransferChoice(true)}
                        >
                            Yes, transfer
                        </Button>
                        <Button
                            variant="ghost"
                            class="rounded-full px-5"
                            on:click={() => handleInitialTransferChoice(false)}
                        >
                            No, use account data
                        </Button>
                    </div>
                </div>
            {/if}
        </section>

        <!-- Profile messages -->
        {#if profileError}
            <p class="text-sm text-destructive">{profileError}</p>
        {/if}
        {#if profileSuccess}
            <p class="text-sm text-emerald-600 dark:text-emerald-400">
                {profileSuccess}
            </p>
        {/if}

        <!-- ── Not authenticated view ──────────────────────────────────── -->
    {:else}
        <section class="rounded-3xl border border-border bg-background/70 p-6">
            <div
                class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
            >
                <div>
                    <h3 class="text-lg font-semibold">Sign in</h3>
                    <p class="text-sm text-muted-foreground">
                        Sign in to access and manage your profile.
                    </p>
                </div>
            </div>

            <div class="mt-4 flex items-center gap-2">
                <button
                    type="button"
                    class={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                        authMode === "login"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                    on:click={() => {
                        authMode = "login";
                        resetAuthMessages();
                    }}
                >
                    Login
                </button>
                <button
                    type="button"
                    class={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                        authMode === "register"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                    on:click={() => {
                        authMode = "register";
                        resetAuthMessages();
                    }}
                >
                    Create account
                </button>
            </div>

            <div class="mt-4 grid gap-3 md:grid-cols-2">
                <label
                    class="flex flex-col gap-2 text-sm font-medium md:col-span-2"
                >
                    <span>Email</span>
                    <Input
                        bind:value={authEmail}
                        type="email"
                        placeholder="Email"
                    />
                </label>
                <label class="flex flex-col gap-2 text-sm font-medium">
                    <span>Password</span>
                    <Input
                        bind:value={authPassword}
                        type="password"
                        placeholder="Password"
                    />
                </label>
                {#if authMode === "register"}
                    <label class="flex flex-col gap-2 text-sm font-medium">
                        <span>Confirm password</span>
                        <Input
                            bind:value={authPasswordConfirm}
                            type="password"
                            placeholder="Confirm password"
                        />
                    </label>
                {/if}
            </div>

            <div class="mt-4">
                <Button class="rounded-full px-5" on:click={handleAuthSubmit}>
                    {authMode === "login" ? "Login" : "Create account"}
                </Button>
            </div>

            {#if authError || $cloudAuth.error}
                <p class="mt-3 text-sm text-destructive">
                    {authError || $cloudAuth.error}
                </p>
            {/if}

            {#if authSuccess}
                <p class="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
                    {authSuccess}
                </p>
            {/if}
        </section>
    {/if}
</div>
