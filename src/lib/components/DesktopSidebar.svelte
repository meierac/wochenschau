<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { profile } from "../stores/profile";

    export let collapsed = false;
    export let activeView: "calendar" | "messages" | "registrations" | "files" =
        "calendar";

    const dispatch = createEventDispatcher<{
        openCalendar: void;
        openMessages: void;
        openRegistrations: void;
        openFiles: void;
        openProfile: void;
        openSettings: void;
        toggleCollapse: void;
    }>();

    $: sidebarProfileImage = $profile.profileImage.trim();
    $: sidebarProfileName = `${$profile.firstName} ${$profile.lastName}`.trim();
</script>

<aside
    class={`h-[stretched] shrink-0 overflow-hidden floating-glass-surface rounded-[2rem]  m-4 p-1.5 border-r border-border  transition-[width] duration-200 ease-out ${
        collapsed ? "w-20" : "w-72"
    }`}
>
    <div class="flex h-full flex-col justify-between gap-3">
        <div class="flex flex-col gap-2">
            {#if collapsed}
                <div
                    class="flex min-h-[72px] items-center justify-center rounded-[1.4rem] px-3 py-3"
                >
                    <img
                        src="/wochenschau/favicon.svg"
                        alt="Wochenschau Logo"
                        width="40"
                        height="40"
                        class="h-10 w-10 shrink-0 rounded-xl"
                    />
                </div>
            {:else}
                <div
                    class="flex min-h-[72px] items-center justify-between gap-3 rounded-[1.4rem] px-3 py-3"
                >
                    <div class="flex min-w-0 items-center gap-3">
                        <img
                            src="/wochenschau/favicon.svg"
                            alt="Wochenschau Logo"
                            width="40"
                            height="40"
                            class="h-10 w-10 shrink-0 rounded-xl"
                        />
                        <span class="truncate text-lg font-semibold">
                            Wochenschau
                        </span>
                    </div>
                </div>
            {/if}

            <button
                on:click={() => dispatch("openCalendar")}
                class={`flex w-full items-center rounded-2xl px-3 py-3 text-left transition-colors active:bg-muted ${
                    activeView === "calendar"
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                } ${collapsed ? "justify-center" : "gap-3"}`}
                aria-label="Open calendar page"
                title="Calendar"
            >
                <svg
                    class="h-6 w-6 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
                {#if !collapsed}
                    <span class="text-sm font-semibold leading-none"
                        >Calendar</span
                    >
                {/if}
            </button>

            <button
                on:click={() => dispatch("openMessages")}
                class={`flex w-full items-center rounded-2xl px-3 py-3 text-left transition-colors active:bg-muted ${
                    activeView === "messages"
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                } ${collapsed ? "justify-center" : "gap-3"}`}
                aria-label="Open messages page"
                title="Messages"
            >
                <svg
                    class="h-6 w-6 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 10h8m-8 4h5m-7 7l-2-2H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-9l-4 2z"
                    />
                </svg>
                {#if !collapsed}
                    <span class="text-sm font-semibold leading-none"
                        >Messages</span
                    >
                {/if}
            </button>

            <button
                on:click={() => dispatch("openRegistrations")}
                class={`flex w-full items-center rounded-2xl px-3 py-3 text-left transition-colors active:bg-muted ${
                    activeView === "registrations"
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                } ${collapsed ? "justify-center" : "gap-3"}`}
                aria-label="Open registrations page"
                title="Registrations"
            >
                <svg
                    class="h-6 w-6 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
                {#if !collapsed}
                    <span class="text-sm font-semibold leading-none"
                        >Registrations</span
                    >
                {/if}
            </button>

            <button
                on:click={() => dispatch("openFiles")}
                class={`flex w-full items-center rounded-2xl px-3 py-3 text-left transition-colors active:bg-muted ${
                    activeView === "files"
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                } ${collapsed ? "justify-center" : "gap-3"}`}
                aria-label="Open files page"
                title="Files"
            >
                <svg
                    class="h-6 w-6 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 7a2 2 0 012-2h3.586a2 2 0 011.414.586l2.414 2.414A2 2 0 0117 9.414V17a2 2 0 01-2 2H9a2 2 0 01-2-2V7z"
                    />
                </svg>
                {#if !collapsed}
                    <span class="text-sm font-semibold leading-none">Files</span
                    >
                {/if}
            </button>
        </div>

        <div class="flex flex-col gap-2">
            <button
                on:click={() => dispatch("openSettings")}
                class={`flex w-full items-center rounded-2xl px-3 py-3 text-left text-muted-foreground transition-colors active:bg-muted hover:bg-muted hover:text-foreground ${collapsed ? "justify-center" : "gap-3"}`}
                aria-label="Open settings"
                title="Settings"
            >
                <svg
                    class="h-6 w-6 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                </svg>
                {#if !collapsed}
                    <span class="text-sm font-semibold leading-none"
                        >Settings</span
                    >
                {/if}
            </button>

            {#if !sidebarProfileImage}
                <button
                    on:click={() => dispatch("openProfile")}
                    class={`flex w-full items-center rounded-2xl px-3 py-3 text-left text-muted-foreground transition-colors active:bg-muted hover:bg-muted hover:text-foreground ${collapsed ? "justify-center" : "gap-3"}`}
                    aria-label="Open profile page"
                    title={sidebarProfileName || "Profile"}
                >
                    <svg
                        class="h-6 w-6 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M16 14a4 4 0 10-8 0m8 0a4 4 0 01-8 0m8 0v1a3 3 0 01-3 3H11a3 3 0 01-3-3v-1m8 0H8"
                        />
                        <circle
                            cx="12"
                            cy="8"
                            r="3"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                        />
                    </svg>
                    {#if !collapsed}
                        <span class="text-sm font-semibold leading-none">
                            {sidebarProfileName || "Profile"}
                        </span>
                    {/if}
                </button>
            {/if}
            {#if sidebarProfileImage}
                <button
                    on:click={() => dispatch("openProfile")}
                    class={`flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left text-muted-foreground transition-colors active:bg-muted hover:bg-muted hover:text-foreground ${collapsed ? "justify-center" : "gap-3"}`}
                    aria-label="Open profile details"
                    title={sidebarProfileName || "Profile"}
                >
                    <img
                        src={sidebarProfileImage}
                        alt={sidebarProfileName || "Profile"}
                        class="h-8 w-8 shrink-0 rounded-xl object-cover border border-border"
                    />
                    {#if !collapsed}
                        <div class="min-w-0 flex-1">
                            <p
                                class="truncate text-sm font-semibold leading-none text-foreground"
                            >
                                {sidebarProfileName || "Profile"}
                            </p>
                        </div>
                    {/if}
                </button>
            {/if}
            <button
                on:click={() => dispatch("toggleCollapse")}
                aria-label="Expand sidebar"
                aria-expanded="false"
                title="Expand sidebar"
                type="button"
                class={`flex w-full items-center rounded-2xl px-3 py-3 text-left transition-colors active:bg-muted text-muted-foreground hover:bg-muted hover:text-foreground ${collapsed ? "justify-center" : "gap-3"}`}
            >
                {#if !collapsed}
                    <svg
                        class="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>

                    <span class="text-sm font-semibold leading-none"
                        >Collapse</span
                    >
                {/if}
                {#if collapsed}
                    <svg
                        class="h-6 w-6 shrink-0 rotate-180"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                {/if}
            </button>
        </div>
    </div>
</aside>
