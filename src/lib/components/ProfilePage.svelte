<script lang="ts">
    import { profile } from "../stores/profile";
    import type { UserProfile } from "../types";
    import Button from "./Button.svelte";
    import Input from "./Input.svelte";

    let isEditing = false;
    let draft: UserProfile = {
        role: "",
        username: "",
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        profileImage: "",
        shortBio: "",
    };

    $: currentProfile = $profile;
    $: profileImagePreview = currentProfile.profileImage.trim();

    function startEditing() {
        draft = { ...currentProfile };
        isEditing = true;
    }

    function cancelEditing() {
        draft = { ...currentProfile };
        isEditing = false;
    }

    function saveProfile() {
        profile.updateProfile({
            role: draft.role.trim(),
            username: draft.username.trim(),
            firstName: draft.firstName.trim(),
            lastName: draft.lastName.trim(),
            email: draft.email.trim(),
            phoneNumber: draft.phoneNumber.trim(),
            profileImage: draft.profileImage.trim(),
            shortBio: draft.shortBio.trim(),
        });
        isEditing = false;
    }

    function getInitials(profileData: UserProfile) {
        const initials =
            `${profileData.firstName.charAt(0)}${profileData.lastName.charAt(0)}`.trim();
        return (
            initials || profileData.username.slice(0, 2).toUpperCase() || "U"
        );
    }

    function formatValue(value: string) {
        return value.trim() || "—";
    }
</script>

<div
    class="flex h-full flex-col gap-6 overflow-y-auto rounded-[2rem] bg-card/60 p-8 shadow-sm border border-border backdrop-blur-xl"
>
    <div
        class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between"
    >
        <div class="flex items-center gap-4">
            {#if profileImagePreview}
                <img
                    src={profileImagePreview}
                    alt="Profile"
                    class="h-20 w-20 rounded-3xl object-cover border border-border"
                />
            {:else}
                <div
                    class="flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary text-xl font-bold text-secondary-foreground"
                >
                    {getInitials(currentProfile)}
                </div>
            {/if}

            <div>
                <h1 class="text-3xl font-bold">Profile</h1>
                <p class="mt-1 text-sm text-muted-foreground">
                    View and manage your personal profile information.
                </p>
            </div>
        </div>

        <div class="flex items-center gap-3">
            {#if isEditing}
                <Button
                    variant="ghost"
                    class="rounded-full px-5"
                    on:click={cancelEditing}
                >
                    Cancel
                </Button>
                <Button class="rounded-full px-5" on:click={saveProfile}>
                    Save
                </Button>
            {:else}
                <Button class="rounded-full px-5" on:click={startEditing}>
                    Edit
                </Button>
            {/if}
        </div>
    </div>

    {#if isEditing}
        <div class="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            <section
                class="rounded-3xl border border-border bg-background/70 p-6"
            >
                <h2 class="text-lg font-semibold">Edit profile</h2>
                <div class="mt-6 grid gap-4 md:grid-cols-2">
                    <label class="flex flex-col gap-2 text-sm font-medium">
                        <span>User role</span>
                        <Input
                            bind:value={draft.role}
                            placeholder="User role"
                        />
                    </label>
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
                        <span>Email</span>
                        <Input
                            bind:value={draft.email}
                            type="email"
                            placeholder="Email"
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
                        <span>Profile Image</span>
                        <Input
                            bind:value={draft.profileImage}
                            placeholder="Image URL"
                        />
                    </label>
                    <label
                        class="flex flex-col gap-2 text-sm font-medium md:col-span-2"
                    >
                        <span>Short Bio/description</span>
                        <textarea
                            bind:value={draft.shortBio}
                            rows="5"
                            class="flex w-full rounded-lg border border-input bg-transparent px-4 py-3 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-150 resize-y min-h-[132px]"
                            placeholder="Tell us a little about yourself"
                        ></textarea>
                    </label>
                </div>
            </section>

            <section
                class="rounded-3xl border border-border bg-background/70 p-6"
            >
                <h2 class="text-lg font-semibold">Preview</h2>
                <div
                    class="mt-6 flex flex-col items-center rounded-3xl bg-card/60 p-6 text-center"
                >
                    {#if draft.profileImage.trim()}
                        <img
                            src={draft.profileImage.trim()}
                            alt="Profile preview"
                            class="h-24 w-24 rounded-3xl object-cover border border-border"
                        />
                    {:else}
                        <div
                            class="flex h-24 w-24 items-center justify-center rounded-3xl bg-secondary text-2xl font-bold text-secondary-foreground"
                        >
                            {getInitials(draft)}
                        </div>
                    {/if}
                    <h3 class="mt-4 text-xl font-semibold">
                        {formatValue(
                            `${draft.firstName} ${draft.lastName}`.trim(),
                        )}
                    </h3>
                    <p class="mt-1 text-sm text-muted-foreground">
                        @{formatValue(draft.username) === "—"
                            ? "—"
                            : draft.username.trim()}
                    </p>
                    <p class="mt-4 text-sm leading-6 text-muted-foreground">
                        {formatValue(draft.shortBio)}
                    </p>
                </div>
            </section>
        </div>
    {:else}
        <div class="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            <section
                class="rounded-3xl border border-border bg-background/70 p-6"
            >
                <h2 class="text-lg font-semibold">Profile details</h2>
                <dl class="mt-6 grid gap-x-6 gap-y-5 md:grid-cols-2">
                    <div>
                        <dt
                            class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                            User role
                        </dt>
                        <dd class="mt-1 text-sm">
                            {formatValue(currentProfile.role)}
                        </dd>
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
                        <dd class="mt-1 text-sm break-all">
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
                            Profile Image
                        </dt>
                        <dd class="mt-1 text-sm break-all">
                            {formatValue(currentProfile.profileImage)}
                        </dd>
                    </div>
                    <div class="md:col-span-2">
                        <dt
                            class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                            Short Bio/description
                        </dt>
                        <dd class="mt-1 text-sm leading-6 whitespace-pre-wrap">
                            {formatValue(currentProfile.shortBio)}
                        </dd>
                    </div>
                </dl>
            </section>

            <section
                class="rounded-3xl border border-border bg-background/70 p-6"
            >
                <h2 class="text-lg font-semibold">Profile summary</h2>
                <div
                    class="mt-6 flex flex-col items-center rounded-3xl bg-card/60 p-6 text-center"
                >
                    {#if profileImagePreview}
                        <img
                            src={profileImagePreview}
                            alt="Profile"
                            class="h-24 w-24 rounded-3xl object-cover border border-border"
                        />
                    {:else}
                        <div
                            class="flex h-24 w-24 items-center justify-center rounded-3xl bg-secondary text-2xl font-bold text-secondary-foreground"
                        >
                            {getInitials(currentProfile)}
                        </div>
                    {/if}
                    <h3 class="mt-4 text-xl font-semibold">
                        {formatValue(
                            `${currentProfile.firstName} ${currentProfile.lastName}`.trim(),
                        )}
                    </h3>
                    <p class="mt-1 text-sm text-muted-foreground">
                        {currentProfile.username.trim()
                            ? `@${currentProfile.username.trim()}`
                            : "No username set"}
                    </p>
                    <p class="mt-4 text-sm text-muted-foreground">
                        {formatValue(currentProfile.role)}
                    </p>
                </div>
            </section>
        </div>
    {/if}
</div>
