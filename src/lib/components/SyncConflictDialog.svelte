<script lang="ts">
    import type { SyncConflict, ConflictResolution } from "../types/index.js";
    import { createEventDispatcher } from "svelte";
    import SwipeableSheet from "./SwipeableSheet.svelte";
    import IconButton from "./IconButton.svelte";
    import Button from "./Button.svelte";

    export let conflicts: SyncConflict[] = [];
    export let isDesktop = false;

    const dispatch = createEventDispatcher<{
        resolve: ConflictResolution;
        close: void;
    }>();

    function handleKeepLocal() {
        dispatch("resolve", "keep-local");
    }

    function handleUseSynced() {
        dispatch("resolve", "use-synced");
    }

    function handleClose() {
        dispatch("close");
    }

    $: conflictCount = conflicts.length;
    $: affectedSubscriptions = [
        ...new Set(conflicts.map((c) => c.subscriptionName)),
    ];
</script>

<SwipeableSheet {isDesktop} on:close={handleClose}>
    <div class="flex flex-col h-full">
        <div class="flex items-center justify-center relative px-6 pt-6 pb-4">
            <h3 class="text-lg font-semibold text-foreground">
                Sync Conflicts Detected
            </h3>
            <div class="absolute right-3 top-3">
                <IconButton
                    variant="secondary"
                    size="lg"
                    ariaLabel="Close"
                    on:click={handleClose}
                >
                    <svg
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </IconButton>
            </div>
        </div>

        <div
            class="flex items-start rounded-3xl gap-3 m-3 px-3 pt-4 pb-4 bg-amber-50 dark:bg-amber-900/20"
        >
            <div
                class="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex-shrink-0"
            >
                <svg
                    class="w-6 h-6 text-amber-600 dark:text-amber-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {conflictCount}
                    {conflictCount === 1 ? "item" : "items"} modified locally
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    You have made local changes that would be overwritten by
                    syncing.
                </p>
            </div>
        </div>

        <div class="flex-1 overflow-y-auto px-3 py-4 space-y-4">
            <div class="px-3">
                <div class="flex items-center gap-2 text-sm font-medium">
                    <svg
                        class="w-4 h-4 text-gray-600 dark:text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8 7V3m8 4V3m-9 8h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                    <span class="text-gray-700 dark:text-gray-300"
                        >Affected Calendars:</span
                    >
                </div>
                <ul class="space-y-1 ml-6">
                    {#each affectedSubscriptions as subscription}
                        <li class="text-sm text-gray-600 dark:text-gray-400">
                            {subscription}
                        </li>
                    {/each}
                </ul>
            </div>

            <div class="space-y-2 p-3">
                <div class="flex items-center gap-2 text-sm font-medium">
                    <svg
                        class="w-4 h-4 text-gray-600 dark:text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                    </svg>
                    <span class="text-gray-700 dark:text-gray-300"
                        >Modified Items:</span
                    >
                </div>
                <ul class="space-y-2 ml-6">
                    {#each conflicts.slice(0, 5) as conflict}
                        <li
                            class="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
                        >
                            <span class="text-amber-500 mt-1">•</span>
                            <div class="flex-1 min-w-0">
                                <div
                                    class="font-medium text-gray-700 dark:text-gray-300 truncate"
                                >
                                    {conflict.localItem.summary}
                                </div>
                                {#if conflict.localItem.description}
                                    <div class="text-xs opacity-75 truncate">
                                        {conflict.localItem.description}
                                    </div>
                                {/if}
                            </div>
                        </li>
                    {/each}
                    {#if conflicts.length > 5}
                        <li class="text-xs text-gray-500 dark:text-gray-500">
                            ... and {conflicts.length - 5} more
                        </li>
                    {/if}
                </ul>
            </div>

            <div
                class="text-xs text-gray-500 dark:text-gray-400 space-y-2 bg-blue-50 dark:bg-blue-900/20 rounded-3xl p-3"
            >
                <p>
                    <strong class="text-gray-700 dark:text-gray-300"
                        >Keep My Changes:</strong
                    > Your modified items stay as-is. New events are added, deleted
                    events are removed, and unchanged events are updated.
                </p>
                <p>
                    <strong class="text-gray-700 dark:text-gray-300"
                        >Use Synced Data:</strong
                    > Your local changes will be discarded and replaced with the
                    data from the calendar subscription.
                </p>
            </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 p-3">
            <Button
                on:click={handleKeepLocal}
                class="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >Keep My Changes</Button
            >
            <Button
                on:click={handleUseSynced}
                class="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 dark:active:bg-gray-500 text-gray-900 dark:text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >Use Synced Data</Button
            >
        </div>
    </div>
</SwipeableSheet>
