<script lang="ts">
    import WeekView from "./lib/components/WeekView.svelte";
    import FloatingNav from "./lib/components/FloatingNav.svelte";
    import AddActivityModal from "./lib/components/AddActivityModal.svelte";
    import SettingsSheet from "./lib/components/SettingsSheet.svelte";
    import ExportSheet from "./lib/components/ExportSheet.svelte";
    import { currentWeek, currentYear } from "./lib/stores/week";
    import { formatDateRange } from "./lib/utils/date";
    import WeekPicker from "./lib/components/WeekPicker.svelte";

    let isDesktop = false;
    let showAddActivity = false;
    let showSettings = false;
    let showWeekPicker = false;
    let showExport = false;

    function handleResize() {
        isDesktop = window.innerWidth >= 768;
    }

    function handleOpenAddActivity() {
        showAddActivity = true;
    }

    function handleCloseAddActivity() {
        showAddActivity = false;
    }

    function handleOpenSettings() {
        showSettings = true;
    }

    function handleWeekSelected(
        event: CustomEvent<{ week: number; year: number }>,
    ) {
        currentWeek.set(event.detail.week);
        currentYear.set(event.detail.year);
        showWeekPicker = false;
    }

    function handleOpenExport() {
        showExport = true;
    }
</script>

<svelte:window on:resize={handleResize} />

<main class="min-h-screen bg-background text-foreground">
    {#if isDesktop}
        <!-- Desktop Layout -->
        <div class="max-w-7xl mx-auto px-4 py-6 h-screen flex flex-col">
            <!-- Desktop Header -->
            <div class="mb-4 flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <h1 class="text-4xl font-bold">📅 Wochenschau</h1>
                    <button
                        on:click={() => (showWeekPicker = true)}
                        class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        aria-label="Pick week"
                        title="Pick week"
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
                                d="M8 7V3m8 4V3m-9 8h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                        <span class="text-sm font-semibold">
                            W{$currentWeek} • {formatDateRange(
                                $currentWeek,
                                $currentYear,
                            )}
                        </span>
                    </button>
                </div>
                <div class="flex gap-2">
                    <button
                        on:click={handleOpenAddActivity}
                        class="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
                    >
                        + Add Activity
                    </button>
                    <button
                        on:click={handleOpenExport}
                        class="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                        aria-label="Export weekly agenda"
                        title="Export as image"
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
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                        </svg>
                        Export
                    </button>
                    <button
                        on:click={handleOpenSettings}
                        class="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                        aria-label="Open settings"
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
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                        Settings
                    </button>
                </div>
            </div>

            <!-- Week View -->
            <div class="flex-1 overflow-hidden">
                <WeekView />
            </div>
        </div>
    {:else}
        <!-- Mobile Layout -->
        <div class="h-screen flex flex-col pb-20 relative">
            <!-- Mobile Header -->
            <div
                class="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-background/80 to-transparent px-4 py-3 flex items-center justify-between pointer-events-none backdrop-blur-lg"
                style="mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%);"
            >
                <h1 class="text-2xl font-bold pointer-events-auto">
                    📅 Wochenschau
                </h1>
                <div
                    class="hidden sm:block text-sm text-muted-foreground pointer-events-auto"
                >
                    W{$currentWeek} • {formatDateRange(
                        $currentWeek,
                        $currentYear,
                    )}
                </div>
            </div>

            <!-- Week View -->
            <div class="flex-1 overflow-hidden px-2 py-2">
                <WeekView />
            </div>

            <!-- Floating Navigation Bar -->
            <FloatingNav
                on:openAddActivity={handleOpenAddActivity}
                on:openSettings={handleOpenSettings}
                on:openExport={handleOpenExport}
            />
        </div>
    {/if}
</main>

<!-- Modals/Sheets -->
{#if showAddActivity}
    <AddActivityModal on:close={handleCloseAddActivity} {isDesktop} />
{/if}

{#if showSettings}
    <SettingsSheet on:close={() => (showSettings = false)} {isDesktop} />
{/if}

{#if showWeekPicker}
    <WeekPicker
        currentWeek={$currentWeek}
        currentYear={$currentYear}
        on:weekSelected={handleWeekSelected}
        on:close={() => (showWeekPicker = false)}
    />
{/if}

{#if showExport}
    <ExportSheet on:close={() => (showExport = false)} {isDesktop} />
{/if}

<style>
    :global(body) {
        margin: 0;
        padding: 0;
    }
</style>
