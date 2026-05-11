<script lang="ts">
    export let title: string;
    export let description = "";
</script>

<div class="rounded-3xl border border-border bg-muted/20 p-4">
    <div class="space-y-1">
        <h3 class="text-lg font-semibold text-foreground">{title}</h3>
        {#if description}
            <p class="text-xs text-muted-foreground leading-relaxed">
                {description}
            </p>
        {/if}
    </div>
</div>
