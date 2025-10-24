<script lang="ts">
    import type { SyncConflict, ConflictResolution } from "../types/index.js";
    import { createEventDispatcher } from "svelte";

    export let conflicts: SyncConflict[] = [];
    export let isOpen = false;

    const dispatch = createEventDispatcher<{
        resolve: ConflictResolution;
        close: void;
    }>();

    function handleKeepLocal() {
        dispatch("resolve", "keep-local");
        isOpen = false;
    }

    function handleUseSynced() {
        dispatch("resolve", "use-synced");
        isOpen = false;
    }

    function handleClose() {
        dispatch("close");
        isOpen = false;
    }

    $: conflictCount = conflicts.length;
    $: affectedSubscriptions = [
        ...new Set(conflicts.map((c) => c.subscriptionName)),
    ];
</script>

{#if isOpen}
    <!-- Backdrop -->
    <div
        class="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        on:click={handleClose}
        on:keydown={(e) => e.key === "Escape" && handleClose()}
        role="button"
        tabindex="0"
    ></div>

    <!-- Dialog -->
    <div
        class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
        role="dialog"
        aria-labelledby="conflict-dialog-title"
        aria-describedby="conflict-dialog-description"
    >
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl">
            <!-- Header -->
            <div
                class="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700"
            >
                <div class="flex items-center gap-3">
                    <div
                        class="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg"
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
                    <div>
                        <h2
                            id="conflict-dialog-title"
                            class="text-xl font-semibold text-gray-900 dark:text-white"
                        >
                            Sync Conflicts Detected
                        </h2>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            {conflictCount}
                            {conflictCount === 1 ? "item" : "items"} modified locally
                        </p>
                    </div>
                </div>
                <button
                    on:click={handleClose}
                    class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    aria-label="Close dialog"
                >
                    <svg
                        class="w-5 h-5 text-gray-500 dark:text-gray-400"
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
                </button>
            </div>

            <!-- Content -->
            <div class="p-6 space-y-4">
                <p
                    id="conflict-dialog-description"
                    class="text-gray-700 dark:text-gray-300"
                >
                    You have made local changes to calendar items that would be
                    overwritten by syncing. What would you like to do?
                </p>

                <!-- Affected Subscriptions -->
                <div
                    class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-2"
                >
                    <div class="flex items-center gap-2 text-sm font-medium">
                        <svg
                            class="w-4 h-4"
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
                        <span class="text-gray-700 dark:text-gray-300">
                            Affected Calendars:
                        </span>
                    </div>
                    <ul class="space-y-1 ml-6">
                        {#each affectedSubscriptions as subscription}
                            <li
                                class="text-sm text-gray-600 dark:text-gray-400"
                            >
                                {subscription}
                            </li>
                        {/each}
                    </ul>
                </div>

                <!-- Conflict Items Preview -->
                <div class="space-y-2 max-h-48 overflow-y-auto">
                    <div class="flex items-center gap-2 text-sm font-medium">
                        <svg
                            class="w-4 h-4"
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
                        <span class="text-gray-700 dark:text-gray-300">
                            Modified Items:
                        </span>
                    </div>
                    <ul class="space-y-2 ml-6">
                        {#each conflicts.slice(0, 5) as conflict}
                            <li
                                class="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
                            >
                                <span class="text-amber-500 mt-1">•</span>
                                <div class="flex-1">
                                    <div
                                        class="font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        {conflict.localItem.summary}
                                    </div>
                                    {#if conflict.localItem.description}
                                        <div
                                            class="text-xs opacity-75 truncate"
                                        >
                                            {conflict.localItem.description}
                                        </div>
                                    {/if}
                                </div>
                            </li>
                        {/each}
                        {#if conflicts.length > 5}
                            <li
                                class="text-xs text-gray-500 dark:text-gray-500"
                            >
                                ... and {conflicts.length - 5} more
                            </li>
                        {/if}
                    </ul>
                </div>
            </div>

            <!-- Actions -->
            <div
                class="flex flex-col sm:flex-row gap-3 p-6 border-t border-gray-200 dark:border-gray-700"
            >
                <button
                    on:click={handleKeepLocal}
                    class="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                    Keep My Changes
                </button>
                <button
                    on:click={handleUseSynced}
                    class="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                    Use Synced Data
                </button>
            </div>

            <!-- Info Note -->
            <div
                class="px-6 pb-6 text-xs text-gray-500 dark:text-gray-400 space-y-1"
            >
                <p>
                    <strong>Keep My Changes:</strong> Your local edits will be preserved,
                    but won't sync back to the calendar source.
                </p>
                <p>
                    <strong>Use Synced Data:</strong> Your local changes will be
                    discarded and replaced with the data from the calendar subscription.
                </p>
            </div>
        </div>
    </div>
{/if}
