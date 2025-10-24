<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import { fly, fade } from "svelte/transition";
    import { quintOut } from "svelte/easing";

    export let isDesktop = false;
    export let maxHeight = "90vh";
    export let desktopMaxWidth = "md:max-w-md";
    export let padding = "p-2"; // Tailwind padding class for margin around sheet

    const dispatch = createEventDispatcher();

    // Debug logging
    $: console.log("SwipeableSheet isDesktop:", isDesktop);

    let isDragging = false;
    let startY = 0;
    let currentY = 0;
    let translateY = 0;
    let velocity = 0;
    let lastTime = 0;
    let lastY = 0;
    let sheetElement: HTMLDivElement | null = null;

    const SWIPE_THRESHOLD = 100; // Distance in pixels to trigger close
    const VELOCITY_THRESHOLD = 0.5; // Velocity threshold for quick swipe

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            dispatch("close");
        }
    }

    function findScrollableParent(element: HTMLElement): HTMLElement | null {
        let current = element;
        while (current && current !== sheetElement) {
            const overflowY = window.getComputedStyle(current).overflowY;
            if (
                (overflowY === "auto" || overflowY === "scroll") &&
                current.scrollHeight > current.clientHeight
            ) {
                return current;
            }
            current = current.parentElement as HTMLElement;
        }
        return null;
    }

    function handleTouchStart(e: TouchEvent) {
        if (isDesktop) return;

        // Check if we're touching a scrollable area that's not at the top
        const target = e.target as HTMLElement;
        const scrollableParent = findScrollableParent(target);

        if (scrollableParent && scrollableParent.scrollTop > 0) {
            // Allow native scrolling if not at top
            return;
        }

        const touch = e.touches[0];
        startY = touch.clientY;
        currentY = touch.clientY;
        lastY = touch.clientY;
        lastTime = Date.now();
        isDragging = true;
        velocity = 0;
    }

    function handleTouchMove(e: TouchEvent) {
        if (!isDragging || isDesktop) return;

        const touch = e.touches[0];
        currentY = touch.clientY;
        const deltaY = currentY - startY;

        // Check if there's a scrollable element being touched
        const target = e.target as HTMLElement;
        const scrollableParent = findScrollableParent(target);

        // Only allow downward dragging
        if (deltaY > 0) {
            // If there's a scrollable parent at the top, allow sheet dragging
            if (!scrollableParent || scrollableParent.scrollTop === 0) {
                translateY = deltaY;

                // Calculate velocity
                const now = Date.now();
                const timeDiff = now - lastTime;
                if (timeDiff > 0) {
                    velocity = (currentY - lastY) / timeDiff;
                }
                lastY = currentY;
                lastTime = now;

                // Prevent default scroll on mobile when dragging
                e.preventDefault();
            }
        } else if (
            deltaY < 0 &&
            scrollableParent &&
            scrollableParent.scrollTop === 0
        ) {
            // At top of scroll, trying to scroll up - allow it
            isDragging = false;
            translateY = 0;
        }
    }

    function handleTouchEnd() {
        if (!isDragging || isDesktop) return;

        isDragging = false;

        // Close if dragged past threshold or fast swipe down
        if (translateY > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD) {
            dispatch("close");
        } else {
            // Snap back to original position
            translateY = 0;
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            dispatch("close");
        }
    }

    onMount(() => {
        // Prevent body scroll when sheet is open on mobile
        if (!isDesktop) {
            document.body.style.overflow = "hidden";

            // Add touch event listeners with passive: false for iOS
            if (sheetElement) {
                sheetElement.addEventListener("touchstart", handleTouchStart, {
                    passive: false,
                });
                sheetElement.addEventListener("touchmove", handleTouchMove, {
                    passive: false,
                });
                sheetElement.addEventListener("touchend", handleTouchEnd, {
                    passive: false,
                });
            }
        }

        return () => {
            if (!isDesktop) {
                document.body.style.overflow = "";

                // Clean up event listeners
                if (sheetElement) {
                    sheetElement.removeEventListener(
                        "touchstart",
                        handleTouchStart,
                    );
                    sheetElement.removeEventListener(
                        "touchmove",
                        handleTouchMove,
                    );
                    sheetElement.removeEventListener(
                        "touchend",
                        handleTouchEnd,
                    );
                }
            }
        };
    });
</script>

<div
    class="fixed inset-0 bg-black/50 flex {isDesktop
        ? 'items-center'
        : 'items-end'} justify-center z-50 {padding}"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    on:click={handleBackdropClick}
    on:keydown={handleKeydown}
    in:fade={{ duration: 200 }}
    out:fade={{ duration: 200 }}
>
    <div
        bind:this={sheetElement}
        class={`bg-card/60 backdrop-blur-xl shadow-lg w-full flex flex-col ${
            isDesktop ? `${desktopMaxWidth} rounded-lg` : "rounded-3xl"
        }`}
        style="
         border-radius: 36px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
            max-height: {isDesktop ? '80vh' : maxHeight};
            transform: translateY({translateY}px);
            transition: {isDragging
            ? 'none'
            : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'};
            touch-action: none;
            will-change: transform;
        "
        in:fly={{ y: isDesktop ? 0 : 500, duration: 300, easing: quintOut }}
        out:fly={{ y: isDesktop ? 0 : 500, duration: 250, easing: quintOut }}
    >
        <!-- Swipe indicator for mobile -->
        {#if !isDesktop}
            <div
                class="absolute w-full top-0 flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
                style="touch-action: none; -webkit-user-select: none; user-select: none; pointer-events: none;"
            >
                <div
                    class="w-10 h-1 rounded-full bg-muted-foreground/30"
                    style="transition: background-color 0.2s; {isDragging
                        ? 'background-color: rgb(var(--muted-foreground) / 0.5);'
                        : ''}"
                ></div>
            </div>
        {/if}

        <!-- Content slot -->
        <slot />
    </div>
</div>

<style>
    /* Ensure smooth scrolling within the sheet */
    :global(.sheet-content) {
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
    }
</style>
