<script lang="ts">
    export let id: string;
    export let label: string;
    export let value: string;
    export let options: Array<{ name: string; value: string }> = [];
    export let labelClass =
        "block text-xs font-medium text-muted-foreground mb-2";
    export let selectClass =
        "flex-1 w-full px-3 py-2 bg-background border border-input rounded-3xl text-foreground text-sm font-mono";
</script>

<div>
    <label for={id} class={labelClass}>{label}</label>
    <select
        id={id}
        bind:value
        class={selectClass}
        style="font-family: {value};"
    >
        {#each options as option}
            <option value={option.value} style="font-family: {option.value};">
                {option.name}
            </option>
        {/each}
    </select>
</div>
