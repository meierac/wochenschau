<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { subscriptions } from "../stores/ical";
    import { activities } from "../stores/activities";
    import type { ICalSubscription, CalendarItem } from "../types/index";
    import { getWeekNumber } from "../utils/date";
    import Button from "./Button.svelte";

    export let isDesktop = false;

    const dispatch = createEventDispatcher();

    let showNewSubscription = false;
    let newSubscription = {
        url: "",
        name: "",
    };
    let isLoading = false;
    let error: string | null = null;

    function handleAddSubscription() {
        if (!newSubscription.url.trim() || !newSubscription.name.trim()) return;

        const subscription: ICalSubscription = {
            id: `ical-${Date.now()}`,
            url: newSubscription.url,
            name: newSubscription.name,
            enabled: true,
            lastFetched: Date.now(),
        };

        subscriptions.addSubscription(subscription);
        showNewSubscription = false;
        newSubscription = { url: "", name: "" };
    }

    async function handleRefresh(id: string) {
        isLoading = true;
        error = null;
        try {
            const subscription = $subscriptions.find((s) => s.id === id);
            if (!subscription) return;

            // Fetch iCal data
            const response = await fetch(subscription.url);
            if (!response.ok) throw new Error("Failed to fetch iCal");

            const text = await response.text();
            const calendarItems = parseICalToCalendarItems(text, id);

            // Remove old items from this subscription
            const oldActivities = $activities.filter(
                (a) => a.sourceId === id && a.source === "ical",
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
        } catch (err) {
            error = err instanceof Error ? err.message : "Unknown error";
        } finally {
            isLoading = false;
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

    function handleToggleSubscription(id: string) {
        const subscription = $subscriptions.find((s) => s.id === id);
        if (subscription) {
            subscriptions.updateSubscription({
                ...subscription,
                enabled: !subscription.enabled,
            });
        }
    }

    function handleDeleteSubscription(id: string) {
        if (confirm("Delete this subscription?")) {
            // Remove associated calendar items
            const itemsToRemove = $activities.filter(
                (a) => a.sourceId === id && a.source === "ical",
            );
            for (const item of itemsToRemove) {
                activities.removeActivity(item.id);
            }
            subscriptions.removeSubscription(id);
        }
    }

    function handleRefreshAll() {
        $subscriptions.forEach((sub) => {
            if (sub.enabled) {
                handleRefresh(sub.id);
            }
        });
    }

    function handleClose() {
        dispatch("close");
    }

    $: itemCount = (subscriptionId: string) => {
        return $activities.filter(
            (a) => a.sourceId === subscriptionId && a.source === "ical",
        ).length;
    };
</script>

<div
    class="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-3"
>
    <div
        class={`bg-card rounded-2xl md:rounded-lg shadow-lg w-full transition-all flex flex-col ${
            isDesktop ? "md:max-w-md" : ""
        }`}
    >
        <!-- Header -->
        <div
            class="border-b border-border px-6 py-4 flex items-center justify-between"
        >
            <h3 class="text-lg font-semibold text-foreground">
                iCal Subscriptions
            </h3>
            <button
                on:click={handleClose}
                class="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
            >
                ✕
            </button>
        </div>

        <!-- Content -->
        <div class="p-3 max-h-[60vh] overflow-y-auto">
            {#if error}
                <div
                    class="mb-4 p-3 bg-destructive/10 border border-destructive rounded-lg"
                >
                    <p class="text-sm text-destructive">{error}</p>
                </div>
            {/if}

            {#if $subscriptions.length === 0 && !showNewSubscription}
                <div class="text-center py-8">
                    <p class="text-muted-foreground text-sm">
                        No subscriptions yet
                    </p>
                    <p class="text-muted-foreground text-xs mt-1">
                        Add an iCal link to import events
                    </p>
                </div>
            {:else}
                <div class="space-y-2">
                    {#each $subscriptions as subscription}
                        <div
                            class="p-3 bg-muted rounded-lg border border-border space-y-2"
                        >
                            <div class="flex items-center justify-between">
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
                                    class="flex items-center gap-2 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={subscription.enabled}
                                        on:change={() =>
                                            handleToggleSubscription(
                                                subscription.id,
                                            )}
                                        class="w-4 h-4 rounded cursor-pointer"
                                    />
                                </label>
                            </div>

                            {#if subscription.lastFetched}
                                <div class="text-xs text-muted-foreground">
                                    Last fetched: {new Date(
                                        subscription.lastFetched,
                                    ).toLocaleDateString()}
                                </div>
                            {/if}

                            {#if itemCount(subscription.id) > 0}
                                <div class="text-xs text-muted-foreground">
                                    {itemCount(subscription.id)} event{itemCount(
                                        subscription.id,
                                    ) !== 1
                                        ? "s"
                                        : ""}
                                </div>
                            {/if}

                            <div class="flex gap-2">
                                <button
                                    on:click={() =>
                                        handleRefresh(subscription.id)}
                                    disabled={isLoading}
                                    class="flex-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded active:opacity-80 transition-opacity disabled:opacity-50"
                                >
                                    {isLoading ? "Loading..." : "Refresh"}
                                </button>
                                <button
                                    on:click={() =>
                                        handleDeleteSubscription(
                                            subscription.id,
                                        )}
                                    class="flex-1 px-2 py-1 text-xs bg-destructive/20 text-destructive rounded active:opacity-80 transition-opacity"
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
                    class="mt-4 p-3 bg-muted rounded-lg border border-border space-y-3"
                >
                    <input
                        type="text"
                        bind:value={newSubscription.name}
                        placeholder="Subscription name"
                        class="w-full px-3 py-2 bg-background border border-input rounded text-foreground text-sm"
                    />
                    <input
                        type="url"
                        bind:value={newSubscription.url}
                        placeholder="iCal URL (https://...)"
                        class="w-full px-3 py-2 bg-background border border-input rounded text-foreground text-sm"
                    />
                    <div class="flex gap-2">
                        <Button
                            variant="default"
                            size="sm"
                            class="flex-1"
                            on:click={handleAddSubscription}
                        >
                            Add
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            class="flex-1"
                            on:click={() => (showNewSubscription = false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            {:else}
                <Button
                    variant="secondary"
                    class="w-full mt-4"
                    on:click={() => (showNewSubscription = true)}
                >
                    + Add Subscription
                </Button>
            {/if}
        </div>

        <!-- Actions -->
        <div class="border-t border-border px-6 py-4 flex gap-2">
            {#if $subscriptions.length > 0}
                <Button
                    variant="secondary"
                    size="sm"
                    class="flex-1"
                    on:click={handleRefreshAll}
                    disabled={isLoading}
                >
                    Refresh All
                </Button>
            {/if}
            <Button variant="secondary" class="flex-1" on:click={handleClose}>
                Close
            </Button>
        </div>
    </div>
</div>
