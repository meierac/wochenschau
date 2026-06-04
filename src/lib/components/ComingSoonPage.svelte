<script lang="ts">
    export let title: string;
    export let description = "This area is under construction and will be available soon.";
</script>

<div class="flex h-full flex-col items-center justify-center rounded-[2rem] border border-border bg-card/60 px-6 py-10 text-center backdrop-blur-xl">
    <div class="flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary text-secondary-foreground">
        <svg
            class="h-10 w-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </svg>
    </div>

    <h2 class="mt-6 text-2xl font-semibold text-foreground">{title}</h2>
    <p class="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        Coming soon. {description}
    </p>
</div>
