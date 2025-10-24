<script lang="ts">
    export let value: number;
    export let min: number = 0;
    export let max: number = 100;
    export let step: number | undefined = undefined;
    export let id: string = "";
    export let disabled: boolean = false;
</script>

<div class="range-slider-container">
    <input
        {id}
        type="range"
        {min}
        {max}
        {step}
        {disabled}
        bind:value
        class="range-slider w-full"
        class:has-step={step !== undefined}
    />
</div>

<style>
    .range-slider-container {
        width: 100%;
        display: flex;
        align-items: center;
    }

    .range-slider {
        -webkit-appearance: none;
        appearance: none;
        background-color: hsl(var(--muted));
        margin: 0;
        padding: 0;
        height: 2rem;
        width: 100%;
        border-radius: 1rem;
        overflow: hidden;
        cursor: pointer;
        border: none;
    }

    /* Webkit (Chrome, Safari, Edge) - Thumb */
    .range-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 0;
        height: 3.5rem;
        box-shadow: -20rem 0 0 20rem hsl(var(--primary) / 0.3);
        cursor: pointer;
    }

    /* Firefox - Track */
    .range-slider::-moz-range-track {
        background: transparent;
        border: none;
        height: 3.5rem;
    }

    /* Firefox - Thumb */
    .range-slider::-moz-range-thumb {
        border: none;
        width: 0;
        height: 3.5rem;
        background: transparent;
        box-shadow: -20rem 0 0 20rem hsl(var(--primary) / 0.3);
        cursor: pointer;
    }

    /* Firefox - Progress */
    .range-slider::-moz-range-progress {
        background: transparent;
        height: 3.5rem;
    }

    /* Focus state */
    .range-slider:focus {
        outline: none;
    }

    .range-slider:focus-visible {
        outline: 2px solid hsl(var(--primary));
        outline-offset: 2px;
    }

    /* Disabled state */
    .range-slider:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .range-slider:disabled::-webkit-slider-thumb {
        cursor: not-allowed;
    }

    .range-slider:disabled::-moz-range-thumb {
        cursor: not-allowed;
    }
</style>
