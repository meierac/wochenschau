<script lang="ts">
    export let id: string;
    export let label: string;
    export let value: string;
    export let placeholder = "";
    export let labelClass =
        "block text-xs font-medium text-muted-foreground mb-2";
    export let colorInputClass =
        "w-12 h-10 rounded border border-input cursor-pointer";
    export let textInputClass =
        "flex-1 px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm font-mono";
</script>

<div>
    <label for={id} class={labelClass}>{label}</label>
    <div class="flex gap-2">
        <input
            id={id}
            type="color"
            bind:value
            class={colorInputClass}
        />
        <input
            type="text"
            bind:value
            class={textInputClass}
            {placeholder}
        />
    </div>
</div>
