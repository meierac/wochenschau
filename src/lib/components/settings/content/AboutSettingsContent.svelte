<script lang="ts">
    export let appVersion: string;

    import SettingsIntroCard from "../SettingsIntroCard.svelte";
    import SettingsSectionCard from "../SettingsSectionCard.svelte";
</script>

<div class="space-y-4">
    <SettingsIntroCard
        title="About Wochenschau"
        description="A simple weekly planning companion with export, sync, and inspiration built in."
    />

    <SettingsSectionCard
        title="App info"
        description="Basic information about the app and where it comes from."
    >
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div
                class="rounded-2xl border border-border/70 bg-background/40 p-4"
            >
                <p
                    class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
                >
                    Version
                </p>
                <p class="mt-2 text-sm font-semibold text-foreground">
                    {appVersion}
                </p>
            </div>
            <div
                class="rounded-2xl border border-border/70 bg-background/40 p-4"
            >
                <p
                    class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
                >
                    Created in the heart of
                </p>
                <p class="mt-2 text-sm font-semibold text-foreground">
                    Kaiserstuhl 🍇
                </p>
            </div>
        </div>
    </SettingsSectionCard>

    <SettingsSectionCard
        title="Hidden gems"
        description="A few features worth knowing about."
    >
        <div class="space-y-3">
            <div
                class="rounded-2xl border border-border/70 bg-background/40 p-4"
            >
                <p class="text-foreground mb-1">
                    <span class="font-semibold">Swipe to navigate</span>
                </p>
                <p class="text-xs text-muted-foreground">
                    Swipe left or right on your calendar to switch weeks.
                </p>
            </div>
            <div
                class="rounded-2xl border border-border/70 bg-background/40 p-4"
            >
                <p class="text-foreground mb-1">
                    <span class="font-semibold">Export & share</span>
                </p>
                <p class="text-xs text-muted-foreground">
                    Export your week as a beautiful image and share it with friends.
                </p>
            </div>
            <div
                class="rounded-2xl border border-border/70 bg-background/40 p-4"
            >
                <p class="text-foreground mb-1">
                    <span class="font-semibold">Calendar sync</span>
                </p>
                <p class="text-xs text-muted-foreground">
                    Subscribe to iCal calendars to automatically import events.
                </p>
            </div>
            <div
                class="rounded-2xl border border-border/70 bg-background/40 p-4"
            >
                <p class="text-foreground mb-1">
                    <span class="font-semibold">Daily inspiration</span>
                </p>
                <p class="text-xs text-muted-foreground">
                    Enable Bible verses of the day for daily inspiration.
                </p>
            </div>
        </div>
    </SettingsSectionCard>
</div>
