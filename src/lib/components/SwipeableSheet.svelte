<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import { fly, fade } from "svelte/transition";
    import { quintOut } from "svelte/easing";

    // Props
    export let isDesktop = false;
    export let maxHeight = "90vh";
    export let desktopMaxWidth = "md:max-w-md";
    export let padding = "p-2";

    const dispatch = createEventDispatcher();

    // Touch state
    let isDragging = false;
    let startY = 0;
    let currentY = 0;
    let translateY = 0;
    let velocity = 0;
    let lastY = 0;
    let lastTime = 0;

    // Configuration
    const DISMISS_THRESHOLD = 100; // pixels
    const VELOCITY_THRESHOLD = 0.5; // pixels per millisecond
    const RESISTANCE_FACTOR = 3; // Resistance when dragging up

    /**
     * Finds the nearest scrollable parent element
     */
    function findScrollableParent(
        element: HTMLElement,
        container: HTMLElement,
    ): HTMLElement | null {
        let current = element;

        while (current && current !== container) {
            const style = window.getComputedStyle(current);
            const overflowY = style.overflowY;
            const isScrollable =
                (overflowY === "auto" || overflowY === "scroll") &&
                current.scrollHeight > current.clientHeight;

            if (isScrollable) {
                return current;
            }

            current = current.parentElement as HTMLElement;
        }

        return null;
    }

    /**
     * Check if touch should start drag gesture
     */
    function shouldStartDrag(
        target: HTMLElement,
        container: HTMLElement,
    ): boolean {
        // Always allow drag on desktop
        if (isDesktop) return false;

        const scrollableParent = findScrollableParent(target, container);

        // If there's a scrollable element and it's not at the top, don't drag
        if (scrollableParent && scrollableParent.scrollTop > 0) {
            return false;
        }

        return true;
    }

    /**
     * Svelte action for touch handling
     */
    function swipeHandler(node: HTMLElement) {
        if (isDesktop) return {};

        function onTouchStart(e: TouchEvent) {
            const target = e.target as HTMLElement;

            if (!shouldStartDrag(target, node)) {
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

        function onTouchMove(e: TouchEvent) {
            if (!isDragging) return;

            const touch = e.touches[0];
            currentY = touch.clientY;
            const deltaY = currentY - startY;

            // Calculate velocity for quick swipes
            const now = Date.now();
            const timeDiff = now - lastTime;
            if (timeDiff > 0) {
                velocity = (currentY - lastY) / timeDiff;
            }
            lastY = currentY;
            lastTime = now;

            // Handle drag direction
            if (deltaY > 0) {
                // Dragging down - follow finger directly
                translateY = deltaY;

                // Prevent page scroll when dragging down
                if (deltaY > 10) {
                    e.preventDefault();
                }
            } else {
                // Dragging up - apply resistance
                const target = e.target as HTMLElement;
                const scrollableParent = findScrollableParent(target, node);

                if (!scrollableParent || scrollableParent.scrollTop === 0) {
                    // At top of content, apply resistance to upward drag
                    translateY = deltaY / RESISTANCE_FACTOR;
                    e.preventDefault();
                } else {
                    // Allow scrolling up
                    isDragging = false;
                    translateY = 0;
                }
            }
        }

        function onTouchEnd() {
            if (!isDragging) return;

            isDragging = false;

            // Dismiss if:
            // 1. Dragged past threshold, OR
            // 2. Fast downward swipe (velocity check)
            const shouldDismiss =
                translateY > DISMISS_THRESHOLD || velocity > VELOCITY_THRESHOLD;

            if (shouldDismiss) {
                dispatch("close");
            } else {
                // Snap back to original position
                translateY = 0;
            }

            // Reset velocity
            velocity = 0;
        }

        function onTouchCancel() {
            isDragging = false;
            translateY = 0;
            velocity = 0;
        }

        // Add event listeners with passive: false for iOS
        node.addEventListener("touchstart", onTouchStart, { passive: false });
        node.addEventListener("touchmove", onTouchMove, { passive: false });
        node.addEventListener("touchend", onTouchEnd, { passive: false });
        node.addEventListener("touchcancel", onTouchCancel, {
            passive: false,
        });

        return {
            destroy() {
                node.removeEventListener("touchstart", onTouchStart);
                node.removeEventListener("touchmove", onTouchMove);
                node.removeEventListener("touchend", onTouchEnd);
                node.removeEventListener("touchcancel", onTouchCancel);
            },
        };
    }

    /**
     * Handle backdrop click
     */
    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            dispatch("close");
        }
    }

    /**
     * Handle keyboard events
     */
    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            dispatch("close");
        }
    }

    /**
     * Prevent body scroll on mobile
     */
    onMount(() => {
        if (!isDesktop) {
            const originalStyles = {
                overflow: document.body.style.overflow,
                position: document.body.style.position,
                width: document.body.style.width,
                top: document.body.style.top,
            };

            // Lock body scroll
            const scrollY = window.scrollY;
            document.body.style.overflow = "hidden";
            document.body.style.position = "fixed";
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = "100%";

            return () => {
                // Restore body scroll
                document.body.style.overflow = originalStyles.overflow;
                document.body.style.position = originalStyles.position;
                document.body.style.width = originalStyles.width;
                document.body.style.top = originalStyles.top;

                // Restore scroll position
                window.scrollTo(0, scrollY);
            };
        }
    });
</script>

<!-- Backdrop -->
<div
    class="fixed inset-0 bg-black/50 z-50 flex {isDesktop
        ? 'items-center justify-center'
        : 'items-end'} {padding}"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    on:click={handleBackdropClick}
    on:keydown={handleKeydown}
    in:fade={{ duration: 200 }}
    out:fade={{ duration: 200 }}
>
    <!-- Sheet Container -->
    <div
        use:swipeHandler
        class="bg-card/60 backdrop-blur-xl shadow-lg w-full flex flex-col overflow-hidden
            {isDesktop ? desktopMaxWidth + ' rounded-lg' : 'rounded-t-3xl'}"
        style="
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
            max-height: {isDesktop ? '80vh' : maxHeight};
            transform: translate3d(0, {translateY}px, 0);
            transition: {isDragging
            ? 'none'
            : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'};
            touch-action: none;
            -webkit-user-select: none;
            user-select: none;
        "
        in:fly={{
            y: isDesktop ? 0 : 500,
            duration: 300,
            easing: quintOut,
        }}
        out:fly={{
            y: isDesktop ? 0 : 500,
            duration: 250,
            easing: quintOut,
        }}
    >
        <!-- Mobile Swipe Indicator -->
        {#if !isDesktop}
            <div
                class="w-full flex justify-center pt-3 pb-2 flex-shrink-0"
                style="touch-action: none;"
            >
                <div
                    class="w-10 h-1 rounded-full transition-colors {isDragging
                        ? 'bg-muted-foreground/50'
                        : 'bg-muted-foreground/30'}"
                ></div>
            </div>
        {/if}

        <!-- Content Slot -->
        <slot />
    </div>
</div>

<style>
    /* Ensure smooth scrolling within sheet content */
    :global(.sheet-content) {
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
    }
</style>
