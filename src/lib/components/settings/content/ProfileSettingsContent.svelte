<script lang="ts">
    import { getContext, onDestroy } from "svelte";
    import { profile } from "../../../stores/profile";
    import { mobileHeaderActions } from "../../../stores/mobilePageHeader";
    import type { UserProfile } from "../../../types";
    import Button from "../../Button.svelte";
    import Input from "../../Input.svelte";

    const isPage: boolean = getContext("settingsIsPage") ?? false;

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

    function formatValue(value: string) {
        return value.trim() || "—";
    }

    // When in mobile page mode, push edit/save/cancel into the App header
    $: if (isPage) {
        if (isEditing) {
            mobileHeaderActions.set([
                { label: "Cancel", onClick: cancelEditing, variant: "ghost" },
                { label: "Save", onClick: saveProfile },
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
    {#if !isPage}
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
                    <Button class="rounded-full px-5" on:click={saveProfile}>
                        Save
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
    {#if isEditing}
        <div class="flex">
            <section
                class="rounded-3xl border border-border bg-background/70 p-6"
            >
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
                            class="min-h-[132px] w-full resize-y rounded-lg border border-input bg-transparent px-4 py-3 text-base placeholder:text-muted-foreground transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            placeholder="Tell us a little about yourself"
                        ></textarea>
                    </label>
                </div>
            </section>
        </div>
    {:else}
        <div class="flex">
            <section
                class="rounded-3xl border border-border bg-background/70 p-6"
            >
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
                            Profile Image
                        </dt>
                        <dd class="mt-1 break-all text-sm">
                            {formatValue(currentProfile.profileImage)}
                        </dd>
                    </div>
                    <div class="md:col-span-2">
                        <dt
                            class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                            Short Bio/description
                        </dt>
                        <dd class="mt-1 whitespace-pre-wrap text-sm leading-6">
                            {formatValue(currentProfile.shortBio)}
                        </dd>
                    </div>
                </dl>
            </section>
        </div>
    {/if}
</div>
