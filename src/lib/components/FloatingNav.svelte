<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let activePage:
        | "calendar"
        | "messages"
        | "registrations"
        | "files"
        | "settings" = "calendar";

    const dispatch = createEventDispatcher<{
        navigateCalendar: void;
        navigateSettings: void;
        navigateMessages: void;
        navigateRegistrations: void;
        navigateFiles: void;
    }>();
</script>

<!-- Bottom Blur/Fade Backdrop -->
<div
    class="pointer-events-none fixed bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-background/0 to-transparent backdrop-blur-sm"
    style="height: calc(5rem + env(safe-area-inset-bottom)); padding-bottom: env(safe-area-inset-bottom); mask-image: linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%); -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%);"
></div>

<div class="fixed bottom-3 left-3 right-3 z-20 px-[10px] pb-[10px]">
    <div
        class="flex items-stretch gap-1 p-1 floating-glass-surface floating-glass-pill"
    >
        <button
            on:click={() => dispatch("navigateMessages")}
            class={`flex flex-1 flex-col items-center justify-center gap-1 rounded-3xl px-2 py-2 transition-colors active:bg-muted ${
                activePage === "messages"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground"
            }`}
            aria-label="Open messages page"
            title="Messages"
            type="button"
        >
            <svg
                class="h-5 w-5"
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
            <span class="text-[10px] font-semibold leading-none">Messages</span>
        </button>
        <button
            on:click={() => dispatch("navigateCalendar")}
            class={`flex flex-1 flex-col items-center justify-center gap-1 rounded-3xl px-2 py-2 transition-colors active:bg-secondary ${
                activePage === "calendar"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground"
            }`}
            aria-label="Open calendar page"
            title="Calendar"
            type="button"
        >
            <svg
                class="h-5 w-5"
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
            <span class="text-[10px] font-semibold leading-none">Calendar</span>
        </button>
        <button
            on:click={() => dispatch("navigateRegistrations")}
            class={`flex flex-1 flex-col items-center justify-center gap-1 rounded-3xl px-2 py-2 transition-colors active:bg-muted ${
                activePage === "registrations"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground"
            }`}
            aria-label="Open registrations page"
            title="Registrations"
            type="button"
        >
            <svg
                class="h-5 w-5"
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
            <span class="text-[10px] font-semibold leading-none">Regs</span>
        </button>
        <button
            on:click={() => dispatch("navigateSettings")}
            class={`flex flex-1 flex-col items-center justify-center gap-1 rounded-3xl px-2 py-2 transition-colors active:bg-muted ${
                activePage === "settings"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground"
            }`}
            aria-label="Open settings"
            title="Settings"
            type="button"
        >
            <svg
                class="h-5 w-5"
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
            <span class="text-[10px] font-semibold leading-none">Settings</span>
        </button>
    </div>
</div>
