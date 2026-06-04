<script lang="ts">
    export let title: string;
    export let description = "";
</script>

<section class="rounded-3xl border border-border bg-card/30 p-4">
    <div class="mb-4 space-y-1">
        <h4 class="text-sm font-semibold text-foreground">{title}</h4>
        {#if description}
            <p class="text-xs text-muted-foreground leading-relaxed">
                {description}
            </p>
        {/if}
    </div>

    <slot />
</section>
