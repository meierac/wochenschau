<script lang="ts">
    import RangeSlider from "../RangeSlider.svelte";

    export let id: string;
    export let label: string;
    export let value: number;
    export let min: number;
    export let max: number;
    export let step = 1;
    export let suffix = "";
    export let labelClass =
        "block text-xs font-medium text-muted-foreground mb-2";
    export let extraLabelClass = "";
</script>

<div>
    <label for={id} class={`${labelClass} ${extraLabelClass}`.trim()}>
        {label}: {value}{suffix}
    </label>
    <RangeSlider {id} {min} {max} {step} bind:value />
</div>
