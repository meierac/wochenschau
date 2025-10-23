<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { templates } from "../stores/templates";
    import { subscriptions } from "../stores/ical";
    import { activities } from "../stores/activities";
    import { bibleVerse } from "../stores/bibleVerse";
    import { exportSettings, FONT_FAMILIES } from "../stores/exportSettings";
    import type {
        ActivityTemplate,
        ICalSubscription,
        CalendarItem,
    } from "../types/index";
    import { getWeekNumber } from "../utils/date";
    import IconButton from "./IconButton.svelte";
    import Button from "./Button.svelte";

    export let isDesktop = false;

    const dispatch = createEventDispatcher();
    const APP_VERSION = "1.0.0";

    type SettingType = "templates" | "ical" | "export" | "bibleVerse" | "about";

    interface SettingItem {
        id: SettingType;
        label: string;
        icon: string;
        description: string;
    }

    const settingItems: SettingItem[] = [
        {
            id: "templates",
            label: "Activity Templates",
            icon: "⭐",
            description: `${$templates.length} template${$templates.length !== 1 ? "s" : ""}`,
        },
        {
            id: "ical",
            label: "Calendar Subscriptions",
            icon: "🔗",
            description: `${$subscriptions.length} subscription${$subscriptions.length !== 1 ? "s" : ""}`,
        },
        {
            id: "export",
            label: "Export Settings",
            icon: "🎨",
            description: "Customize export appearance",
        },
        {
            id: "bibleVerse",
            label: "Bible Verse of the Day",
            icon: "✝️",
            description: $bibleVerse.enabled ? "Enabled" : "Disabled",
        },
        {
            id: "about",
            label: "About",
            icon: "ℹ️",
            description: `Version ${APP_VERSION}`,
        },
    ];

    // Mobile: currently selected setting (null = showing list)
    let selectedSetting: SettingType | null = isDesktop ? "export" : null;

    // Template state
    let showNewTemplate = false;
    let newTemplate = {
        name: "",
        startTime: "09:00",
        endTime: "10:00",
    };

    // iCal state
    let showNewSubscription = false;
    let newSubscription = {
        url: "",
        name: "",
    };
    let isLoading = false;
    let error = "";

    // Export settings state
    let fileInput: HTMLInputElement;

    function handleBackgroundImageUpload(e: Event) {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please select an image file");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const imageData = event.target?.result as string;
            exportSettings.setBackgroundImage(imageData);
        };
        reader.readAsDataURL(file);
    }

    function handleRemoveBackgroundImage() {
        exportSettings.setBackgroundImage(null);
        if (fileInput) {
            fileInput.value = "";
        }
    }

    function handleResetExportSettings() {
        if (confirm("Reset all export settings to default?")) {
            exportSettings.reset();
            if (fileInput) {
                fileInput.value = "";
            }
        }
    }

    // Template operations
    function handleAddTemplate() {
        if (!newTemplate.name.trim()) return;

        const template: ActivityTemplate = {
            id: `template-${Date.now()}`,
            name: newTemplate.name,
            startTime: newTemplate.startTime,
            endTime: newTemplate.endTime,
            createdAt: Date.now(),
        };

        templates.addTemplate(template);
        showNewTemplate = false;
        newTemplate = { name: "", startTime: "09:00", endTime: "10:00" };
    }

    function handleDeleteTemplate(id: string) {
        if (confirm("Delete this template?")) {
            templates.removeTemplate(id);
        }
    }

    function handleCancelNewTemplate() {
        showNewTemplate = false;
        newTemplate = { name: "", startTime: "09:00", endTime: "10:00" };
    }

    // iCal operations
    async function handleAddSubscription() {
        if (!newSubscription.url.trim()) return;

        error = "";
        isLoading = true;

        try {
            const response = await fetch(newSubscription.url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const subscription: ICalSubscription = {
                id: `sub-${Date.now()}`,
                url: newSubscription.url,
                name: newSubscription.name || "iCal Feed",
                lastFetched: Date.now(),
                enabled: true,
            };

            subscriptions.addSubscription(subscription);
            showNewSubscription = false;
            newSubscription = { url: "", name: "" };
        } catch (e) {
            error = `Failed to add subscription: ${e instanceof Error ? e.message : String(e)}`;
        } finally {
            isLoading = false;
        }
    }

    async function handleRefresh(subscriptionId: string) {
        error = "";
        isLoading = true;

        try {
            const subscription = $subscriptions.find(
                (s) => s.id === subscriptionId,
            );
            if (!subscription) return;

            const response = await fetch(subscription.url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            const calendarItems = parseICalToCalendarItems(
                text,
                subscriptionId,
            );

            // Remove old items from this subscription
            const oldActivities = $activities.filter(
                (a) => a.sourceId === subscriptionId && a.source === "ical",
            );
            for (const oldActivity of oldActivities) {
                activities.removeActivity(oldActivity.id);
            }

            // Add new calendar items
            for (const item of calendarItems) {
                activities.addActivity(item);
            }

            // Update subscription metadata
            const updated: ICalSubscription = {
                ...subscription,
                lastFetched: Date.now(),
            };
            subscriptions.updateSubscription(updated);
        } catch (e) {
            error = `Failed to refresh: ${e instanceof Error ? e.message : String(e)}`;
        } finally {
            isLoading = false;
        }
    }

    function handleToggleSubscription(id: string, enabled: boolean) {
        const subscription = $subscriptions.find((s) => s.id === id);
        if (!subscription) return;
        const updated: ICalSubscription = {
            ...subscription,
            enabled,
        };
        subscriptions.updateSubscription(updated);
    }

    function handleDeleteSubscription(id: string) {
        if (confirm("Delete this subscription?")) {
            const itemsToRemove = $activities.filter(
                (a) => a.sourceId === id && a.source === "ical",
            );
            for (const item of itemsToRemove) {
                activities.removeActivity(item.id);
            }
            subscriptions.removeSubscription(id);
        }
    }

    async function handleRefreshAll() {
        for (const subscription of $subscriptions) {
            if (subscription.enabled) {
                await handleRefresh(subscription.id);
            }
        }
    }

    function handleClose() {
        dispatch("close");
    }

    function selectSetting(settingId: SettingType) {
        selectedSetting = settingId;
    }

    function backToList() {
        if (!isDesktop) {
            selectedSetting = null;
        }
    }

    function parseICalToCalendarItems(
        iCalText: string,
        subscriptionId: string,
    ): CalendarItem[] {
        const items: CalendarItem[] = [];
        const lines = iCalText.split("\n");

        let currentEvent: any = null;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // Handle line folding (continuation lines)
            while (i + 1 < lines.length && lines[i + 1].match(/^[\t ]/)) {
                i++;
                line += lines[i].substring(1);
            }

            const trimmed = line.trim();

            if (trimmed === "BEGIN:VEVENT") {
                currentEvent = {
                    sourceId: subscriptionId,
                    source: "ical",
                    description: "",
                };
            } else if (trimmed === "END:VEVENT" && currentEvent) {
                // Only add if it has required fields
                if (currentEvent.summary && currentEvent.dtstart) {
                    const item = buildCalendarItem(currentEvent);
                    if (item) {
                        items.push(item);
                    }
                }
                currentEvent = null;
            } else if (currentEvent) {
                const colonIndex = trimmed.indexOf(":");
                if (colonIndex === -1) continue;

                const field = trimmed.substring(0, colonIndex);
                const value = trimmed.substring(colonIndex + 1);

                if (field === "SUMMARY") {
                    currentEvent.summary = decodeICalText(value);
                } else if (field.startsWith("DTSTART")) {
                    currentEvent.dtstart = value;
                } else if (field.startsWith("DTEND")) {
                    currentEvent.dtend = value;
                } else if (field === "UID") {
                    currentEvent.uid = value;
                } else if (field === "DESCRIPTION") {
                    currentEvent.description = decodeICalText(value);
                }
            }
        }

        return items;
    }

    function buildCalendarItem(event: any): CalendarItem | null {
        try {
            const dtstart = event.dtstart || "";
            const dtend = event.dtend || dtstart;

            // Parse date/time information
            const isAllDay = !dtstart.includes("T");
            const startDate = extractDate(dtstart);
            const endDate = extractDate(dtend);
            const startTime = isAllDay ? "09:00" : extractTime(dtstart);
            const endTime = isAllDay ? "17:00" : extractTime(dtend);

            if (!startDate) return null;

            // Convert to Date object to calculate week and day
            const dateObj = new Date(
                parseInt(startDate.substring(0, 4)),
                parseInt(startDate.substring(4, 6)) - 1,
                parseInt(startDate.substring(6, 8)),
            );

            const day = (dateObj.getDay() + 6) % 7; // 0 = Monday
            const week = getWeekNumber(dateObj);
            const year = dateObj.getFullYear();

            const id = event.uid
                ? `${event.sourceId}-${event.uid.replace(/[^a-zA-Z0-9-]/g, "")}`
                : `${event.sourceId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const now = Date.now();

            const item: CalendarItem = {
                id,
                summary: event.summary,
                description: event.description,
                dtstart,
                dtend,
                startDate,
                endDate,
                startTime,
                endTime,
                day,
                week,
                year,
                isAllDay,
                source: "ical",
                sourceId: event.sourceId,
                uid: event.uid,
                createdAt: now,
                lastModified: now,
            };

            return item;
        } catch (err) {
            console.error("Error building calendar item:", err);
            return null;
        }
    }

    function extractDate(iCalDateTime: string): string {
        // Extract YYYYMMDD from iCal datetime
        if (iCalDateTime.includes("T")) {
            return iCalDateTime.split("T")[0];
        }
        return iCalDateTime;
    }

    function extractTime(iCalDateTime: string): string {
        // Extract HH:mm from iCal datetime
        if (!iCalDateTime.includes("T")) {
            return "09:00";
        }

        const timePart = iCalDateTime.split("T")[1];
        const cleanTime = timePart.replace("Z", "");
        const hours = cleanTime.substring(0, 2);
        const minutes = cleanTime.substring(2, 4);

        return `${hours}:${minutes}`;
    }

    function decodeICalText(text: string): string {
        // Decode iCal encoded text
        return text
            .replace(/\\n/g, "\n")
            .replace(/\\,/g, ",")
            .replace(/\\;/g, ";")
            .replace(/\\\\/g, "\\");
    }

    function itemCount(subscriptionId: string): number {
        return $activities.filter(
            (a) => a.sourceId === subscriptionId && a.source === "ical",
        ).length;
    }

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            dispatch("close");
        }
    }

    // Reactive: Update setting items descriptions
    $: settingItems[0].description = `${$templates.length} template${$templates.length !== 1 ? "s" : ""}`;
    $: settingItems[1].description = `${$subscriptions.length} subscription${$subscriptions.length !== 1 ? "s" : ""}`;
    $: settingItems[3].description = $bibleVerse.enabled
        ? "Enabled"
        : "Disabled";
</script>

<div
    class="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4"
    on:click={handleBackdropClick}
>
    <div
        class={`bg-card rounded-2xl md:rounded-lg shadow-lg w-full transition-all flex flex-col ${
            isDesktop ? "md:max-w-5xl md:max-h-[80vh]" : "max-h-[90vh]"
        }`}
    >
        <!-- Header (Always on top) -->
        <div
            class="border-b border-border px-4 py-4 flex items-center justify-between shrink-0"
        >
            <!-- Mobile: Back button when viewing details -->
            {#if !isDesktop && selectedSetting}
                <button
                    on:click={backToList}
                    class="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
                    aria-label="Back to settings"
                >
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
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                    Back
                </button>
            {:else}
                <h3 class="text-lg font-semibold text-foreground">Settings</h3>
            {/if}

            <!-- Close button -->
            <IconButton
                variant="ghost"
                size="md"
                ariaLabel="Close settings"
                on:click={handleClose}
            >
                <svg
                    class="w-6 h-6"
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

        <!-- Content Container -->
        <div class="flex flex-1 overflow-hidden">
            <!-- Mobile: Show list or details based on selection -->
            {#if !isDesktop}
                {#if selectedSetting === null}
                    <!-- Mobile: Settings Menu List -->
                    <div class="w-full overflow-y-auto p-6">
                        <div class="space-y-2">
                            {#each settingItems as item}
                                <button
                                    on:click={() => selectSetting(item.id)}
                                    class="w-full p-4 bg-muted rounded-lg border border-border hover:border-primary transition-colors text-left flex items-center justify-between"
                                >
                                    <div>
                                        <div
                                            class="flex items-center gap-3 mb-1"
                                        >
                                            <span class="text-xl"
                                                >{item.icon}</span
                                            >
                                            <span
                                                class="font-semibold text-foreground"
                                            >
                                                {item.label}
                                            </span>
                                        </div>
                                        <div
                                            class="text-xs text-muted-foreground ml-9"
                                        >
                                            {item.description}
                                        </div>
                                    </div>
                                    <svg
                                        class="w-5 h-5 text-muted-foreground shrink-0"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </button>
                            {/each}
                        </div>
                    </div>
                {:else}
                    <!-- Mobile: Setting Details -->
                    <div class="w-full overflow-y-auto p-6">
                        {#if error}
                            <div
                                class="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg"
                            >
                                <p class="text-sm text-destructive">{error}</p>
                            </div>
                        {/if}

                        {#if selectedSetting === "templates"}
                            <!-- Templates Details -->
                            {#if $templates.length === 0 && !showNewTemplate}
                                <div class="text-center py-8">
                                    <p class="text-muted-foreground text-sm">
                                        No templates yet
                                    </p>
                                    <p
                                        class="text-muted-foreground text-xs mt-1"
                                    >
                                        Create one by adding an activity with
                                        "Save as template"
                                    </p>
                                </div>
                            {:else if !showNewTemplate}
                                <div class="space-y-2">
                                    {#each $templates as template}
                                        <div
                                            class="p-3 bg-muted rounded-lg border border-border flex items-center justify-between gap-2"
                                        >
                                            <div class="flex-1 min-w-0">
                                                <div
                                                    class="font-semibold text-foreground text-sm truncate"
                                                >
                                                    {template.name}
                                                </div>
                                                <div
                                                    class="text-xs text-muted-foreground"
                                                >
                                                    {template.startTime} -
                                                    {template.endTime}
                                                </div>
                                            </div>
                                            <button
                                                on:click={() =>
                                                    handleDeleteTemplate(
                                                        template.id,
                                                    )}
                                                class="text-destructive hover:bg-destructive/10 px-2 py-1 rounded transition-colors text-sm shrink-0"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    {/each}
                                </div>
                            {/if}

                            <!-- Add Template Form -->
                            {#if showNewTemplate}
                                <div
                                    class="p-3 bg-muted rounded-lg border border-border space-y-3"
                                >
                                    <input
                                        type="text"
                                        bind:value={newTemplate.name}
                                        placeholder="Template name"
                                        class="w-full px-3 py-2 bg-background border border-input rounded text-foreground text-sm"
                                    />
                                    <div class="grid grid-cols-2 gap-2">
                                        <input
                                            type="time"
                                            bind:value={newTemplate.startTime}
                                            class="px-3 py-2 bg-background border border-input rounded text-foreground text-sm"
                                        />
                                        <input
                                            type="time"
                                            bind:value={newTemplate.endTime}
                                            class="px-3 py-2 bg-background border border-input rounded text-foreground text-sm"
                                        />
                                    </div>
                                    <div class="flex gap-2">
                                        <button
                                            on:click={handleAddTemplate}
                                            disabled={!newTemplate.name.trim()}
                                            class="flex-1 px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-colors"
                                        >
                                            Save
                                        </button>
                                        <button
                                            on:click={handleCancelNewTemplate}
                                            class="flex-1 px-4 py-2 text-sm font-semibold text-foreground hover:bg-background rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            {:else}
                                <button
                                    on:click={() => (showNewTemplate = true)}
                                    class="w-full mt-4 px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted rounded-lg transition-colors border border-input"
                                >
                                    + New Template
                                </button>
                            {/if}
                        {:else if selectedSetting === "ical"}
                            <!-- iCal Details -->
                            {#if $subscriptions.length === 0 && !showNewSubscription}
                                <div class="text-center py-8">
                                    <p class="text-muted-foreground text-sm">
                                        No iCal subscriptions yet
                                    </p>
                                    <p
                                        class="text-muted-foreground text-xs mt-1"
                                    >
                                        Add a calendar feed by entering an iCal
                                        URL
                                    </p>
                                </div>
                            {:else if !showNewSubscription}
                                <div class="space-y-2">
                                    {#each $subscriptions as subscription}
                                        <div
                                            class="p-3 bg-muted rounded-lg border border-border space-y-2"
                                        >
                                            <div
                                                class="flex items-center justify-between"
                                            >
                                                <div class="flex-1">
                                                    <div
                                                        class="font-semibold text-foreground text-sm"
                                                    >
                                                        {subscription.name}
                                                    </div>
                                                    <div
                                                        class="text-xs text-muted-foreground truncate"
                                                    >
                                                        {subscription.url}
                                                    </div>
                                                </div>
                                                <label
                                                    class="flex items-center gap-2 cursor-pointer shrink-0"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={subscription.enabled}
                                                        on:change={(e) =>
                                                            handleToggleSubscription(
                                                                subscription.id,
                                                                e.currentTarget
                                                                    .checked,
                                                            )}
                                                        class="rounded border-input"
                                                    />
                                                </label>
                                            </div>

                                            {#if subscription.lastFetched}
                                                <div
                                                    class="text-xs text-muted-foreground"
                                                >
                                                    Last fetched: {new Date(
                                                        subscription.lastFetched,
                                                    ).toLocaleString()}
                                                </div>
                                            {/if}

                                            {#if itemCount(subscription.id) > 0}
                                                <div
                                                    class="text-xs text-muted-foreground"
                                                >
                                                    {itemCount(subscription.id)}
                                                    event{itemCount(
                                                        subscription.id,
                                                    ) !== 1
                                                        ? "s"
                                                        : ""}
                                                </div>
                                            {/if}

                                            <div class="flex gap-2">
                                                <button
                                                    on:click={() =>
                                                        handleRefresh(
                                                            subscription.id,
                                                        )}
                                                    disabled={isLoading}
                                                    class="flex-1 px-3 py-1 text-xs font-semibold text-foreground hover:bg-background rounded transition-colors disabled:opacity-50 disabled:pointer-events-none"
                                                >
                                                    Refresh
                                                </button>
                                                <button
                                                    on:click={() =>
                                                        handleDeleteSubscription(
                                                            subscription.id,
                                                        )}
                                                    class="px-3 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            {/if}

                            <!-- Add Subscription Form -->
                            {#if showNewSubscription}
                                <div
                                    class="p-3 bg-muted rounded-lg border border-border space-y-3"
                                >
                                    <input
                                        type="url"
                                        bind:value={newSubscription.url}
                                        placeholder="iCal URL"
                                        class="w-full px-3 py-2 bg-background border border-input rounded text-foreground text-sm"
                                    />
                                    <input
                                        type="text"
                                        bind:value={newSubscription.name}
                                        placeholder="Calendar name (optional)"
                                        class="w-full px-3 py-2 bg-background border border-input rounded text-foreground text-sm"
                                    />
                                    <div class="flex gap-2">
                                        <Button
                                            variant="default"
                                            class="flex-1"
                                            disabled={!newSubscription.url.trim() ||
                                                isLoading}
                                            on:click={handleAddSubscription}
                                        >
                                            {isLoading ? "Adding..." : "Add"}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            class="flex-1"
                                            on:click={() => {
                                                showNewSubscription = false;
                                                newSubscription = {
                                                    url: "",
                                                    name: "",
                                                };
                                                error = "";
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            {:else}
                                <Button
                                    variant="secondary"
                                    class="w-full mt-4"
                                    on:click={() =>
                                        (showNewSubscription = true)}
                                >
                                    + Add Subscription
                                </Button>
                            {/if}

                            <!-- Refresh All Button -->
                            {#if $subscriptions.length > 0 && !showNewSubscription}
                                <Button
                                    variant="secondary"
                                    class="w-full mt-4"
                                    disabled={isLoading}
                                    on:click={handleRefreshAll}
                                >
                                    {isLoading
                                        ? "Refreshing..."
                                        : "Refresh All"}
                                </Button>
                            {/if}
                        {:else if selectedSetting === "bibleVerse"}
                            <!-- Bible Verse Settings -->
                            <div class="space-y-4">
                                <h3
                                    class="text-lg font-semibold text-foreground mb-4"
                                >
                                    Bible Verse of the Day
                                </h3>

                                <div
                                    class="p-4 bg-muted rounded-lg border border-border space-y-3"
                                >
                                    <div class="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="enableBibleVerse"
                                            checked={$bibleVerse.enabled}
                                            on:change={(e) =>
                                                bibleVerse.toggleEnabled(
                                                    e.currentTarget.checked,
                                                )}
                                            class="w-4 h-4 rounded border-input"
                                        />
                                        <label
                                            for="enableBibleVerse"
                                            class="text-sm font-medium text-foreground cursor-pointer"
                                        >
                                            Show Bible Verse on Export
                                        </label>
                                    </div>

                                    {#if $bibleVerse.enabled}
                                        <div
                                            class="mt-4 p-3 bg-background rounded border border-input space-y-2"
                                        >
                                            <p
                                                class="text-sm italic text-foreground"
                                            >
                                                "{$bibleVerse.currentVerse
                                                    .text}"
                                            </p>
                                            <p
                                                class="text-xs text-muted-foreground text-right"
                                            >
                                                – {$bibleVerse.currentVerse
                                                    .reference}
                                            </p>
                                        </div>

                                        <Button
                                            variant="secondary"
                                            class="w-full"
                                            on:click={() =>
                                                bibleVerse.refreshVerse()}
                                        >
                                            🔄 Get New Verse
                                        </Button>
                                    {/if}
                                </div>
                            </div>
                        {:else if selectedSetting === "about"}
                            <!-- About Section -->
                            <div class="space-y-6">
                                <h3
                                    class="text-lg font-semibold text-foreground mb-4"
                                >
                                    About Wochenschau
                                </h3>

                                <!-- App Info -->
                                <div
                                    class="p-4 bg-muted rounded-lg border border-border space-y-3"
                                >
                                    <div>
                                        <p
                                            class="text-xs text-muted-foreground"
                                        >
                                            Version
                                        </p>
                                        <p
                                            class="text-sm font-semibold text-foreground"
                                        >
                                            {APP_VERSION}
                                        </p>
                                    </div>
                                    <div>
                                        <p
                                            class="text-xs text-muted-foreground"
                                        >
                                            Created in the heart of
                                        </p>
                                        <p
                                            class="text-sm font-semibold text-foreground"
                                        >
                                            Kaiserstuhl 🍇
                                        </p>
                                    </div>
                                </div>

                                <!-- Hidden Gems -->
                                <div>
                                    <p
                                        class="text-sm font-semibold text-foreground mb-3"
                                    >
                                        🎁 Hidden Gems
                                    </p>
                                    <div class="space-y-2">
                                        <div
                                            class="p-3 bg-background rounded border border-border text-sm"
                                        >
                                            <p class="text-foreground mb-1">
                                                <span class="font-semibold"
                                                    >Swipe to Navigate</span
                                                >
                                            </p>
                                            <p
                                                class="text-xs text-muted-foreground"
                                            >
                                                Swipe left or right on your
                                                calendar to switch weeks
                                            </p>
                                        </div>
                                        <div
                                            class="p-3 bg-background rounded border border-border text-sm"
                                        >
                                            <p class="text-foreground mb-1">
                                                <span class="font-semibold"
                                                    >Export & Share</span
                                                >
                                            </p>
                                            <p
                                                class="text-xs text-muted-foreground"
                                            >
                                                Export your week as a beautiful
                                                image and share it with friends
                                            </p>
                                        </div>
                                        <div
                                            class="p-3 bg-background rounded border border-border text-sm"
                                        >
                                            <p class="text-foreground mb-1">
                                                <span class="font-semibold"
                                                    >Calendar Sync</span
                                                >
                                            </p>
                                            <p
                                                class="text-xs text-muted-foreground"
                                            >
                                                Subscribe to iCal calendars to
                                                automatically import events
                                            </p>
                                        </div>
                                        <div
                                            class="p-3 bg-background rounded border border-border text-sm"
                                        >
                                            <p class="text-foreground mb-1">
                                                <span class="font-semibold"
                                                    >Daily Inspiration</span
                                                >
                                            </p>
                                            <p
                                                class="text-xs text-muted-foreground"
                                            >
                                                Enable Bible verses of the day
                                                for daily inspiration
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        {:else if selectedSetting === "export"}
                            <h3
                                class="text-lg font-semibold text-foreground mb-4"
                            >
                                Export Settings
                            </h3>

                            <div class="space-y-6">
                                <!-- Typography Section -->
                                <div class="space-y-4">
                                    <h4
                                        class="text-sm font-semibold text-foreground"
                                    >
                                        Typography
                                    </h4>

                                    <!-- Header Font Family -->
                                    <div>
                                        <label
                                            class="block text-xs font-medium text-muted-foreground mb-2"
                                        >
                                            Header Font (Wochenschau)
                                        </label>
                                        <select
                                            bind:value={
                                                $exportSettings.headerFontFamily
                                            }
                                            class="w-full px-3 py-2 bg-background border border-input rounded text-foreground text-sm"
                                        >
                                            {#each FONT_FAMILIES as font}
                                                <option value={font.value}
                                                    >{font.name}</option
                                                >
                                            {/each}
                                        </select>
                                    </div>

                                    <!-- Body Font Family -->
                                    <div>
                                        <label
                                            class="block text-xs font-medium text-muted-foreground mb-2"
                                        >
                                            Body Font (Activities)
                                        </label>
                                        <select
                                            bind:value={
                                                $exportSettings.bodyFontFamily
                                            }
                                            class="w-full px-3 py-2 bg-background border border-input rounded text-foreground text-sm"
                                        >
                                            {#each FONT_FAMILIES as font}
                                                <option value={font.value}
                                                    >{font.name}</option
                                                >
                                            {/each}
                                        </select>
                                    </div>

                                    <!-- Text Color -->
                                    <div>
                                        <label
                                            class="block text-xs font-medium text-muted-foreground mb-2"
                                        >
                                            Text Color
                                        </label>
                                        <div class="flex gap-2">
                                            <input
                                                type="color"
                                                bind:value={
                                                    $exportSettings.textColor
                                                }
                                                class="w-12 h-10 rounded border border-input cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                bind:value={
                                                    $exportSettings.textColor
                                                }
                                                class="flex-1 px-3 py-2 bg-background border border-input rounded text-foreground text-sm font-mono"
                                                placeholder="#000000"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <!-- Background Section -->
                                <div class="space-y-4">
                                    <h4
                                        class="text-sm font-semibold text-foreground"
                                    >
                                        Background
                                    </h4>

                                    <!-- Background Image -->
                                    <div>
                                        <label
                                            class="block text-xs font-medium text-muted-foreground mb-2"
                                        >
                                            Background Image
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            bind:this={fileInput}
                                            on:change={handleBackgroundImageUpload}
                                            class="hidden"
                                        />
                                        {#if $exportSettings.backgroundImage}
                                            <div class="space-y-2">
                                                <div
                                                    class="relative w-full h-32 rounded border border-input overflow-hidden"
                                                >
                                                    <img
                                                        src={$exportSettings.backgroundImage}
                                                        alt="Background preview"
                                                        class="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div class="flex gap-2">
                                                    <Button
                                                        variant="secondary"
                                                        class="flex-1"
                                                        on:click={() =>
                                                            fileInput.click()}
                                                    >
                                                        Change Image
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        on:click={handleRemoveBackgroundImage}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            </div>
                                        {:else}
                                            <Button
                                                variant="secondary"
                                                on:click={() =>
                                                    fileInput.click()}
                                            >
                                                + Upload Image
                                            </Button>
                                        {/if}
                                    </div>

                                    <!-- Background Color -->
                                    <div>
                                        <label
                                            class="block text-xs font-medium text-muted-foreground mb-2"
                                        >
                                            Background Color
                                        </label>
                                        <div class="flex gap-2">
                                            <input
                                                type="color"
                                                bind:value={
                                                    $exportSettings.backgroundColor
                                                }
                                                class="w-12 h-10 rounded border border-input cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                bind:value={
                                                    $exportSettings.backgroundColor
                                                }
                                                class="flex-1 px-3 py-2 bg-background border border-input rounded text-foreground text-sm font-mono"
                                                placeholder="#ffffff"
                                            />
                                        </div>
                                    </div>

                                    <!-- Background Opacity -->
                                    <div>
                                        <label
                                            class="block text-xs font-medium text-muted-foreground mb-2"
                                        >
                                            Background Opacity: {$exportSettings.backgroundOpacity}%
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            bind:value={
                                                $exportSettings.backgroundOpacity
                                            }
                                            class="w-full"
                                        />
                                    </div>
                                </div>

                                <!-- Styling Section -->
                                <div class="space-y-4">
                                    <h4
                                        class="text-sm font-semibold text-foreground"
                                    >
                                        Styling
                                    </h4>

                                    <!-- Accent Color -->
                                    <div>
                                        <label
                                            class="block text-xs font-medium text-muted-foreground mb-2"
                                        >
                                            Accent Color (Borders)
                                        </label>
                                        <div class="flex gap-2">
                                            <input
                                                type="color"
                                                bind:value={
                                                    $exportSettings.accentColor
                                                }
                                                class="w-12 h-10 rounded border border-input cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                bind:value={
                                                    $exportSettings.accentColor
                                                }
                                                class="flex-1 px-3 py-2 bg-background border border-input rounded text-foreground text-sm font-mono"
                                                placeholder="#9333ea"
                                            />
                                        </div>
                                    </div>

                                    <!-- Border Radius -->
                                    <div>
                                        <label
                                            class="block text-xs font-medium text-muted-foreground mb-2"
                                        >
                                            Border Radius: {$exportSettings.borderRadius}px
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="20"
                                            bind:value={
                                                $exportSettings.borderRadius
                                            }
                                            class="w-full"
                                        />
                                    </div>

                                    <!-- Show Borders -->
                                    <div class="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="showBorders"
                                            bind:checked={
                                                $exportSettings.showBorders
                                            }
                                            class="w-4 h-4 rounded border-input"
                                        />
                                        <label
                                            for="showBorders"
                                            class="text-xs font-medium text-muted-foreground cursor-pointer"
                                        >
                                            Show borders around activities
                                        </label>
                                    </div>
                                </div>

                                <!-- Week Container Styling Section -->
                                <div class="space-y-4">
                                    <h4
                                        class="text-sm font-semibold text-foreground"
                                    >
                                        Week Container
                                    </h4>

                                    <!-- Week Container Background Color -->
                                    <div>
                                        <label
                                            class="block text-xs font-medium text-muted-foreground mb-2"
                                        >
                                            Background Color
                                        </label>
                                        <div class="flex gap-2">
                                            <input
                                                type="color"
                                                bind:value={
                                                    $exportSettings.weekContainerBackgroundColor
                                                }
                                                class="w-12 h-10 rounded border border-input cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                bind:value={
                                                    $exportSettings.weekContainerBackgroundColor
                                                }
                                                class="flex-1 px-3 py-2 bg-background border border-input rounded text-foreground text-sm font-mono"
                                                placeholder="rgba(255, 255, 255, 0.75)"
                                            />
                                        </div>
                                    </div>

                                    <!-- Week Container Background Opacity -->
                                    <div>
                                        <label
                                            class="block text-xs font-medium text-muted-foreground mb-2"
                                        >
                                            Background Opacity: {$exportSettings.weekContainerBackgroundOpacity}%
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            bind:value={
                                                $exportSettings.weekContainerBackgroundOpacity
                                            }
                                            class="w-full"
                                        />
                                    </div>
                                </div>

                                <!-- Reset Button -->
                                <div class="pt-4 border-t border-border">
                                    <Button
                                        variant="secondary"
                                        on:click={handleResetExportSettings}
                                    >
                                        Reset to Defaults
                                    </Button>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/if}
            {:else}
                <!-- Desktop: Two Column Layout (left menu, right details) -->
                <!-- Left Column: Settings Menu -->
                <div
                    class="w-48 min-w-[300px] border-r border-border overflow-y-auto bg-muted/30 shrink-0"
                >
                    <div class="p-4 space-y-1">
                        {#each settingItems as item}
                            <button
                                on:click={() => selectSetting(item.id)}
                                class={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                                    selectedSetting === item.id
                                        ? "bg-primary text-primary-foreground"
                                        : "text-foreground hover:bg-muted"
                                }`}
                            >
                                <div class="flex items-center gap-3">
                                    <span class="text-lg">{item.icon}</span>
                                    <div>
                                        <div class="font-semibold text-sm">
                                            {item.label}
                                        </div>
                                        <div
                                            class={`text-xs ${
                                                selectedSetting === item.id
                                                    ? "text-primary-foreground/70"
                                                    : "text-muted-foreground"
                                            }`}
                                        >
                                            {item.description}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        {/each}
                    </div>
                </div>

                <!-- Right Column: Details -->
                <div class="flex-1 overflow-y-auto p-6">
                    {#if error}
                        <div
                            class="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg"
                        >
                            <p class="text-sm text-destructive">{error}</p>
                        </div>
                    {/if}

                    {#if selectedSetting === "templates"}
                        <h3 class="text-xl font-semibold text-foreground mb-4">
                            Activity Templates
                        </h3>

                        {#if $templates.length === 0 && !showNewTemplate}
                            <div class="text-center py-8">
                                <p class="text-muted-foreground text-sm">
                                    No templates yet
                                </p>
                                <p class="text-muted-foreground text-xs mt-1">
                                    Create one by adding an activity with "Save
                                    as template"
                                </p>
                            </div>
                        {:else if !showNewTemplate}
                            <div class="space-y-2 mb-4">
                                {#each $templates as template}
                                    <div
                                        class="p-3 bg-muted rounded-lg border border-border flex items-center justify-between gap-2"
                                    >
                                        <div class="flex-1 min-w-0">
                                            <div
                                                class="font-semibold text-foreground text-sm truncate"
                                            >
                                                {template.name}
                                            </div>
                                            <div
                                                class="text-xs text-muted-foreground"
                                            >
                                                {template.startTime} -
                                                {template.endTime}
                                            </div>
                                        </div>
                                        <button
                                            on:click={() =>
                                                handleDeleteTemplate(
                                                    template.id,
                                                )}
                                            class="text-destructive hover:bg-destructive/10 px-2 py-1 rounded transition-colors text-sm shrink-0"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                {/each}
                            </div>
                        {/if}

                        <!-- Add Template Form -->
                        {#if showNewTemplate}
                            <div
                                class="p-4 bg-muted rounded-lg border border-border space-y-3 max-w-md"
                            >
                                <h4 class="font-semibold text-sm">
                                    Create New Template
                                </h4>
                                <input
                                    type="text"
                                    bind:value={newTemplate.name}
                                    placeholder="Template name"
                                    class="w-full px-3 py-2 bg-background border border-input rounded text-foreground text-sm"
                                />
                                <div class="grid grid-cols-2 gap-2">
                                    <input
                                        type="time"
                                        bind:value={newTemplate.startTime}
                                        class="px-3 py-2 bg-background border border-input rounded text-foreground text-sm"
                                    />
                                    <input
                                        type="time"
                                        bind:value={newTemplate.endTime}
                                        class="px-3 py-2 bg-background border border-input rounded text-foreground text-sm"
                                    />
                                </div>
                                <div class="flex gap-2">
                                    <button
                                        on:click={handleAddTemplate}
                                        disabled={!newTemplate.name.trim()}
                                        class="flex-1 px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-colors"
                                    >
                                        Save
                                    </button>
                                    <button
                                        on:click={handleCancelNewTemplate}
                                        class="flex-1 px-4 py-2 text-sm font-semibold text-foreground hover:bg-background rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        {:else}
                            <button
                                on:click={() => (showNewTemplate = true)}
                                class="px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted rounded-lg transition-colors border border-input"
                            >
                                + New Template
                            </button>
                        {/if}
                    {:else if selectedSetting === "ical"}
                        <h3 class="text-xl font-semibold text-foreground mb-4">
                            Calendar Subscriptions
                        </h3>

                        {#if $subscriptions.length === 0 && !showNewSubscription}
                            <div class="text-center py-8">
                                <p class="text-muted-foreground text-sm">
                                    No iCal subscriptions yet
                                </p>
                                <p class="text-muted-foreground text-xs mt-1">
                                    Add a calendar feed by entering an iCal URL
                                </p>
                            </div>
                        {:else if !showNewSubscription}
                            <div class="space-y-2 mb-4">
                                {#each $subscriptions as subscription}
                                    <div
                                        class="p-3 bg-muted rounded-lg border border-border space-y-2"
                                    >
                                        <div
                                            class="flex items-center justify-between"
                                        >
                                            <div class="flex-1">
                                                <div
                                                    class="font-semibold text-foreground text-sm"
                                                >
                                                    {subscription.name}
                                                </div>
                                                <div
                                                    class="text-xs text-muted-foreground truncate"
                                                >
                                                    {subscription.url}
                                                </div>
                                            </div>
                                            <label
                                                class="flex items-center gap-2 cursor-pointer shrink-0"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={subscription.enabled}
                                                    on:change={(e) =>
                                                        handleToggleSubscription(
                                                            subscription.id,
                                                            e.currentTarget
                                                                .checked,
                                                        )}
                                                    class="rounded border-input"
                                                />
                                            </label>
                                        </div>

                                        {#if subscription.lastFetched}
                                            <div
                                                class="text-xs text-muted-foreground"
                                            >
                                                Last fetched: {new Date(
                                                    subscription.lastFetched,
                                                ).toLocaleString()}
                                            </div>
                                        {/if}

                                        {#if itemCount(subscription.id) > 0}
                                            <div
                                                class="text-xs text-muted-foreground"
                                            >
                                                {itemCount(subscription.id)}
                                                event{itemCount(
                                                    subscription.id,
                                                ) !== 1
                                                    ? "s"
                                                    : ""}
                                            </div>
                                        {/if}

                                        <div class="flex gap-2">
                                            <button
                                                on:click={() =>
                                                    handleRefresh(
                                                        subscription.id,
                                                    )}
                                                disabled={isLoading}
                                                class="flex-1 px-3 py-1 text-xs font-semibold text-foreground hover:bg-background rounded transition-colors disabled:opacity-50 disabled:pointer-events-none"
                                            >
                                                Refresh
                                            </button>
                                            <button
                                                on:click={() =>
                                                    handleDeleteSubscription(
                                                        subscription.id,
                                                    )}
                                                class="px-3 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}

                        <!-- Add Subscription Form -->
                        {#if showNewSubscription}
                            <div
                                class="p-4 bg-muted rounded-lg border border-border space-y-3 max-w-md"
                            >
                                <h4 class="font-semibold text-sm">
                                    Add New Subscription
                                </h4>
                                <input
                                    type="url"
                                    bind:value={newSubscription.url}
                                    placeholder="iCal URL"
                                    class="w-full px-3 py-2 bg-background border border-input rounded text-foreground text-sm"
                                />
                                <input
                                    type="text"
                                    bind:value={newSubscription.name}
                                    placeholder="Calendar name (optional)"
                                    class="w-full px-3 py-2 bg-background border border-input rounded text-foreground text-sm"
                                />
                                <div class="flex gap-2">
                                    <Button
                                        variant="default"
                                        class="flex-1"
                                        disabled={!newSubscription.url.trim() ||
                                            isLoading}
                                        on:click={handleAddSubscription}
                                    >
                                        {isLoading ? "Adding..." : "Add"}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        class="flex-1"
                                        on:click={() => {
                                            showNewSubscription = false;
                                            newSubscription = {
                                                url: "",
                                                name: "",
                                            };
                                            error = "";
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        {:else}
                            <Button
                                variant="secondary"
                                class="mb-4"
                                on:click={() => (showNewSubscription = true)}
                            >
                                + Add Subscription
                            </Button>
                        {/if}

                        <!-- Refresh All Button -->
                        {#if $subscriptions.length > 0 && !showNewSubscription}
                            <Button
                                variant="secondary"
                                on:click={handleRefreshAll}
                                disabled={isLoading}
                            >
                                {isLoading ? "Refreshing..." : "Refresh All"}
                            </Button>
                        {/if}
                    {:else if selectedSetting === "about"}
                        <h3 class="text-xl font-semibold text-foreground mb-4">
                            About Wochenschau
                        </h3>

                        <div class="space-y-6">
                            <!-- App Info -->
                            <div
                                class="p-4 bg-muted rounded-lg border border-border space-y-3"
                            >
                                <div>
                                    <p class="text-xs text-muted-foreground">
                                        Version
                                    </p>
                                    <p
                                        class="text-sm font-semibold text-foreground"
                                    >
                                        {APP_VERSION}
                                    </p>
                                </div>
                                <div>
                                    <p class="text-xs text-muted-foreground">
                                        Created in the heart of
                                    </p>
                                    <p
                                        class="text-sm font-semibold text-foreground"
                                    >
                                        Kaiserstuhl 🍇
                                    </p>
                                </div>
                            </div>

                            <!-- Hidden Gems -->
                            <div>
                                <p
                                    class="text-sm font-semibold text-foreground mb-3"
                                >
                                    🎁 Hidden Gems
                                </p>
                                <div class="space-y-2">
                                    <div
                                        class="p-3 bg-background rounded border border-border text-sm"
                                    >
                                        <p class="text-foreground mb-1">
                                            <span class="font-semibold"
                                                >Swipe to Navigate</span
                                            >
                                        </p>
                                        <p
                                            class="text-xs text-muted-foreground"
                                        >
                                            Swipe left or right on your calendar
                                            to switch weeks
                                        </p>
                                    </div>
                                    <div
                                        class="p-3 bg-background rounded border border-border text-sm"
                                    >
                                        <p class="text-foreground mb-1">
                                            <span class="font-semibold"
                                                >Export & Share</span
                                            >
                                        </p>
                                        <p
                                            class="text-xs text-muted-foreground"
                                        >
                                            Export your week as a beautiful
                                            image and share it with friends
                                        </p>
                                    </div>
                                    <div
                                        class="p-3 bg-background rounded border border-border text-sm"
                                    >
                                        <p class="text-foreground mb-1">
                                            <span class="font-semibold"
                                                >Calendar Sync</span
                                            >
                                        </p>
                                        <p
                                            class="text-xs text-muted-foreground"
                                        >
                                            Subscribe to iCal calendars to
                                            automatically import events
                                        </p>
                                    </div>
                                    <div
                                        class="p-3 bg-background rounded border border-border text-sm"
                                    >
                                        <p class="text-foreground mb-1">
                                            <span class="font-semibold"
                                                >Daily Inspiration</span
                                            >
                                        </p>
                                        <p
                                            class="text-xs text-muted-foreground"
                                        >
                                            Enable Bible verses of the day for
                                            daily inspiration
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    {:else if selectedSetting === "export"}
                        <h3 class="text-xl font-semibold text-foreground mb-4">
                            Export Settings
                        </h3>

                        <div class="space-y-6">
                            <!-- Typography Section -->
                            <div class="space-y-4">
                                <h4
                                    class="text-sm font-semibold text-foreground"
                                >
                                    Typography
                                </h4>

                                <!-- Header Font Family -->
                                <div>
                                    <label
                                        class="block text-xs font-medium text-muted-foreground mb-2"
                                    >
                                        Header Font (Wochenschau)
                                    </label>
                                    <select
                                        bind:value={
                                            $exportSettings.headerFontFamily
                                        }
                                        class="w-full px-3 py-2 bg-background border border-input rounded text-foreground text-sm"
                                    >
                                        {#each FONT_FAMILIES as font}
                                            <option value={font.value}
                                                >{font.name}</option
                                            >
                                        {/each}
                                    </select>
                                </div>

                                <!-- Body Font Family -->
                                <div>
                                    <label
                                        class="block text-xs font-medium text-muted-foreground mb-2"
                                    >
                                        Body Font (Activities)
                                    </label>
                                    <select
                                        bind:value={
                                            $exportSettings.bodyFontFamily
                                        }
                                        class="w-full px-3 py-2 bg-background border border-input rounded text-foreground text-sm"
                                    >
                                        {#each FONT_FAMILIES as font}
                                            <option value={font.value}
                                                >{font.name}</option
                                            >
                                        {/each}
                                    </select>
                                </div>

                                <!-- Text Color -->
                                <div>
                                    <label
                                        class="block text-xs font-medium text-muted-foreground mb-2"
                                    >
                                        Text Color
                                    </label>
                                    <div class="flex gap-2">
                                        <input
                                            type="color"
                                            bind:value={
                                                $exportSettings.textColor
                                            }
                                            class="w-12 h-10 rounded border border-input cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            bind:value={
                                                $exportSettings.textColor
                                            }
                                            class="flex-1 px-3 py-2 bg-background border border-input rounded text-foreground text-sm font-mono"
                                            placeholder="#000000"
                                        />
                                    </div>
                                </div>
                            </div>

                            <!-- Background Section -->
                            <div class="space-y-4">
                                <h4
                                    class="text-sm font-semibold text-foreground"
                                >
                                    Background
                                </h4>

                                <!-- Background Image -->
                                <div>
                                    <label
                                        class="block text-xs font-medium text-muted-foreground mb-2"
                                    >
                                        Background Image
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        bind:this={fileInput}
                                        on:change={handleBackgroundImageUpload}
                                        class="hidden"
                                    />
                                    {#if $exportSettings.backgroundImage}
                                        <div class="space-y-2">
                                            <div
                                                class="relative w-full h-32 rounded border border-input overflow-hidden"
                                            >
                                                <img
                                                    src={$exportSettings.backgroundImage}
                                                    alt="Background preview"
                                                    class="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div class="flex gap-2">
                                                <Button
                                                    variant="secondary"
                                                    class="flex-1"
                                                    on:click={() =>
                                                        fileInput.click()}
                                                >
                                                    Change Image
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    on:click={handleRemoveBackgroundImage}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    {:else}
                                        <Button
                                            variant="secondary"
                                            on:click={() => fileInput.click()}
                                        >
                                            + Upload Image
                                        </Button>
                                    {/if}
                                </div>

                                <!-- Background Color -->
                                <div>
                                    <label
                                        class="block text-xs font-medium text-muted-foreground mb-2"
                                    >
                                        Background Color
                                    </label>
                                    <div class="flex gap-2">
                                        <input
                                            type="color"
                                            bind:value={
                                                $exportSettings.backgroundColor
                                            }
                                            class="w-12 h-10 rounded border border-input cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            bind:value={
                                                $exportSettings.backgroundColor
                                            }
                                            class="flex-1 px-3 py-2 bg-background border border-input rounded text-foreground text-sm font-mono"
                                            placeholder="#ffffff"
                                        />
                                    </div>
                                </div>

                                <!-- Background Opacity -->
                                <div>
                                    <label
                                        class="block text-xs font-medium text-muted-foreground mb-2"
                                    >
                                        Background Opacity: {$exportSettings.backgroundOpacity}%
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        bind:value={
                                            $exportSettings.backgroundOpacity
                                        }
                                        class="w-full"
                                    />
                                </div>
                            </div>

                            <!-- Styling Section -->
                            <div class="space-y-4">
                                <h4
                                    class="text-sm font-semibold text-foreground"
                                >
                                    Styling
                                </h4>

                                <!-- Accent Color -->
                                <div>
                                    <label
                                        class="block text-xs font-medium text-muted-foreground mb-2"
                                    >
                                        Accent Color (Borders)
                                    </label>
                                    <div class="flex gap-2">
                                        <input
                                            type="color"
                                            bind:value={
                                                $exportSettings.accentColor
                                            }
                                            class="w-12 h-10 rounded border border-input cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            bind:value={
                                                $exportSettings.accentColor
                                            }
                                            class="flex-1 px-3 py-2 bg-background border border-input rounded text-foreground text-sm font-mono"
                                            placeholder="#9333ea"
                                        />
                                    </div>
                                </div>

                                <!-- Border Radius -->
                                <div>
                                    <label
                                        class="block text-xs font-medium text-muted-foreground mb-2"
                                    >
                                        Border Radius: {$exportSettings.borderRadius}px
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="20"
                                        bind:value={
                                            $exportSettings.borderRadius
                                        }
                                        class="w-full"
                                    />
                                </div>

                                <!-- Show Borders -->
                                <div class="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="showBorders"
                                        bind:checked={
                                            $exportSettings.showBorders
                                        }
                                        class="w-4 h-4 rounded border-input"
                                    />
                                    <label
                                        for="showBorders"
                                        class="text-xs font-medium text-muted-foreground cursor-pointer"
                                    >
                                        Show borders around activities
                                    </label>
                                </div>
                            </div>

                            <!-- Week Container Styling Section -->
                            <div class="space-y-4">
                                <h4
                                    class="text-sm font-semibold text-foreground"
                                >
                                    Week Container
                                </h4>

                                <!-- Week Container Background Color -->
                                <div>
                                    <label
                                        class="block text-xs font-medium text-muted-foreground mb-2"
                                    >
                                        Background Color
                                    </label>
                                    <div class="flex gap-2">
                                        <input
                                            type="color"
                                            bind:value={
                                                $exportSettings.weekContainerBackgroundColor
                                            }
                                            class="w-12 h-10 rounded border border-input cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            bind:value={
                                                $exportSettings.weekContainerBackgroundColor
                                            }
                                            class="flex-1 px-3 py-2 bg-background border border-input rounded text-foreground text-sm font-mono"
                                            placeholder="rgba(255, 255, 255, 0.75)"
                                        />
                                    </div>
                                </div>

                                <!-- Week Container Background Opacity -->
                                <div>
                                    <label
                                        class="block text-xs font-medium text-muted-foreground mb-2"
                                    >
                                        Background Opacity: {$exportSettings.weekContainerBackgroundOpacity}%
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        bind:value={
                                            $exportSettings.weekContainerBackgroundOpacity
                                        }
                                        class="w-full"
                                    />
                                </div>
                            </div>

                            <!-- Reset Button -->
                            <div class="pt-4 border-t border-border">
                                <Button
                                    variant="secondary"
                                    on:click={handleResetExportSettings}
                                >
                                    Reset to Defaults
                                </Button>
                            </div>
                        </div>
                    {:else if selectedSetting === "bibleVerse"}
                        <h3 class="text-xl font-semibold text-foreground mb-4">
                            Bible Verse of the Day
                        </h3>

                        <div class="space-y-4">
                            <div
                                class="p-4 bg-muted rounded-lg border border-border space-y-3"
                            >
                                <div class="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="enableBibleVerse"
                                        checked={$bibleVerse.enabled}
                                        on:change={(e) =>
                                            bibleVerse.toggleEnabled(
                                                e.currentTarget.checked,
                                            )}
                                        class="w-4 h-4 rounded border-input"
                                    />
                                    <label
                                        for="enableBibleVerse"
                                        class="text-sm font-medium text-foreground cursor-pointer"
                                    >
                                        Show Bible Verse on Export
                                    </label>
                                </div>

                                {#if $bibleVerse.enabled}
                                    <div
                                        class="mt-4 p-3 bg-background rounded border border-input space-y-2"
                                    >
                                        <p
                                            class="text-sm italic text-foreground"
                                        >
                                            "{$bibleVerse.currentVerse.text}"
                                        </p>
                                        <p
                                            class="text-xs text-muted-foreground text-right"
                                        >
                                            – {$bibleVerse.currentVerse
                                                .reference}
                                        </p>
                                    </div>

                                    <Button
                                        variant="secondary"
                                        class="w-full"
                                        on:click={() =>
                                            bibleVerse.refreshVerse()}
                                    >
                                        🔄 Get New Verse
                                    </Button>
                                {/if}
                            </div>
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</div>
