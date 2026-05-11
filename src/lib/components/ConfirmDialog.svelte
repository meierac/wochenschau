<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import Button from "./Button.svelte";
    import IconButton from "./IconButton.svelte";
    import SwipeableSheet from "./SwipeableSheet.svelte";

    export let isOpen = false;
    export let isDesktop = false;
    export let title = "Confirm";
    export let message = "Are you sure?";
    export let confirmLabel = "Confirm";
    export let cancelLabel = "Cancel";
    export let variant: "default" | "destructive" = "default";

    const dispatch = createEventDispatcher<{
        confirm: void;
        cancel: void;
        close: void;
    }>();

    function handleConfirm() {
        dispatch("confirm");
    }

    function handleCancel() {
        dispatch("cancel");
        dispatch("close");
    }
</script>

{#if isOpen}
    <SwipeableSheet
        {isDesktop}
        desktopMaxWidth="28rem"
        maxHeight="40vh"
        on:close={handleCancel}
    >
        <div class="px-3 py-3 flex items-center justify-between border-b border-border">
            <div class="w-12"></div>
            <h3 class="text-lg font-semibold text-foreground text-center flex-1">
                {title}
            </h3>
            <IconButton
                variant="secondary"
                size="lg"
                ariaLabel="Close confirmation dialog"
                on:click={handleCancel}
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

        <div class="p-4 space-y-4">
            <p class="text-sm text-muted-foreground leading-relaxed">
                {message}
            </p>

            <div class="flex gap-2 pt-2">
                <Button
                    variant="secondary"
                    class="flex-1"
                    on:click={handleCancel}
                >
                    {cancelLabel}
                </Button>
                <Button
                    variant={variant === "destructive" ? "destructive" : "default"}
                    class="flex-1"
                    on:click={handleConfirm}
                >
                    {confirmLabel}
                </Button>
            </div>
        </div>
    </SwipeableSheet>
{/if}
