<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import { fly, fade } from "svelte/transition";
    import { quintOut } from "svelte/easing";

    // Props
    export let isDesktop = false;
    export let maxHeight = "90vh";
    export let desktopMaxWidth = "md:max-w-md";

    const dispatch = createEventDispatcher();

    // Touch state
    let isDragging = false;
    let startY = 0;
    let currentY = 0;
    let translateY = 0;
    let velocity = 0;
    let lastY = 0;
    let lastTime = 0;
    let sheetElement: HTMLDivElement | null = null;

    // Configuration
    const DISMISS_THRESHOLD = 100;
    const VELOCITY_THRESHOLD = 0.5;
    const RESISTANCE_FACTOR = 3;

    /**
     * Find scrollable parent element
     */
    function findScrollableParent(
        element: HTMLElement,
        container: HTMLElement | null,
    ): HTMLElement | null {
        if (!container) return null;

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
     * Touch start handler
     */
    function handleTouchStart(e: TouchEvent) {
        if (isDesktop || !sheetElement) return;

        const target = e.target as HTMLElement;
        const scrollableParent = findScrollableParent(target, sheetElement);

        // Don't start drag if scrolled down
        if (scrollableParent && scrollableParent.scrollTop > 0) {
            return;
        }

        const touch = e.touches[0];
        if (!touch) return;

        startY = touch.clientY;
        currentY = touch.clientY;
        lastY = touch.clientY;
        lastTime = Date.now();
        isDragging = true;
        velocity = 0;
    }

    /**
     * Touch move handler
     */
    function handleTouchMove(e: TouchEvent) {
        if (!isDragging || isDesktop || !sheetElement) return;

        const touch = e.touches[0];
        if (!touch) return;

        currentY = touch.clientY;
        const deltaY = currentY - startY;

        // Calculate velocity
        const now = Date.now();
        const timeDiff = now - lastTime;
        if (timeDiff > 0) {
            velocity = (currentY - lastY) / timeDiff;
        }
        lastY = currentY;
        lastTime = now;

        const target = e.target as HTMLElement;
        const scrollableParent = findScrollableParent(target, sheetElement);

        // Dragging down
        if (deltaY > 0) {
            if (!scrollableParent || scrollableParent.scrollTop === 0) {
                translateY = deltaY;

                // Prevent default to stop page scroll
                if (deltaY > 10) {
                    e.preventDefault();
                }
            }
        }
        // Dragging up
        else {
            if (!scrollableParent || scrollableParent.scrollTop === 0) {
                // Apply resistance
                translateY = deltaY / RESISTANCE_FACTOR;
                e.preventDefault();
            } else {
                // Allow scrolling
                isDragging = false;
                translateY = 0;
            }
        }
    }

    /**
     * Touch end handler
     */
    function handleTouchEnd() {
        if (!isDragging || isDesktop) return;

        isDragging = false;

        // Dismiss if dragged past threshold or fast swipe
        const shouldDismiss =
            translateY > DISMISS_THRESHOLD || velocity > VELOCITY_THRESHOLD;

        if (shouldDismiss) {
            dispatch("close");
        } else {
            translateY = 0;
        }

        velocity = 0;
    }

    /**
     * Touch cancel handler
     */
    function handleTouchCancel() {
        isDragging = false;
        translateY = 0;
        velocity = 0;
    }

    /**
     * Backdrop click handler
     */
    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            dispatch("close");
        }
    }

    /**
     * Keyboard handler
     */
    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            dispatch("close");
        }
    }

    /**
     * Setup touch event listeners
     */
    function setupTouchListeners() {
        if (!sheetElement || isDesktop) return;

        sheetElement.addEventListener("touchstart", handleTouchStart, {
            passive: false,
        });
        sheetElement.addEventListener("touchmove", handleTouchMove, {
            passive: false,
        });
        sheetElement.addEventListener("touchend", handleTouchEnd, {
            passive: false,
        });
        sheetElement.addEventListener("touchcancel", handleTouchCancel, {
            passive: false,
        });
    }

    /**
     * Remove touch event listeners
     */
    function removeTouchListeners() {
        if (!sheetElement) return;

        sheetElement.removeEventListener("touchstart", handleTouchStart);
        sheetElement.removeEventListener("touchmove", handleTouchMove);
        sheetElement.removeEventListener("touchend", handleTouchEnd);
        sheetElement.removeEventListener("touchcancel", handleTouchCancel);
    }

    /**
     * Component mount
     */
    onMount(() => {
        // Setup touch listeners after element is bound
        const timer = setTimeout(() => {
            setupTouchListeners();
        }, 0);

        // Prevent body scroll on mobile
        let scrollY = 0;
        if (!isDesktop) {
            scrollY = window.scrollY;
            document.body.style.overflow = "hidden";
            document.body.style.position = "fixed";
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = "100%";
        }

        return () => {
            clearTimeout(timer);
            removeTouchListeners();

            // Restore body scroll
            if (!isDesktop) {
                document.body.style.overflow = "";
                document.body.style.position = "";
                document.body.style.top = "";
                document.body.style.width = "";
                window.scrollTo(0, scrollY);
            }
        };
    });
</script>

<div
    class="sheet-backdrop"
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
        class="sheet-container {isDesktop
            ? 'desktop'
            : 'mobile'} {desktopMaxWidth}"
        class:dragging={isDragging}
        style="--translate-y: {translateY}px; --max-height: {isDesktop
            ? '80vh'
            : maxHeight};"
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
        {#if !isDesktop}
            <div class="swipe-indicator-wrapper">
                <div class="swipe-indicator" class:active={isDragging}></div>
            </div>
        {/if}

        <slot />
    </div>
</div>

<style>
    /* Backdrop */
    .sheet-backdrop {
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 50;
        display: flex;
        touch-action: none;
        -webkit-user-select: none;
        user-select: none;
    }

    .sheet-backdrop.desktop {
        align-items: center;
        justify-content: center;
    }

    .sheet-backdrop:not(.desktop) {
        align-items: flex-end;
    }

    /* Sheet Container */
    .sheet-container {
        background: rgba(255, 255, 255, 0.6);
        backdrop-filter: blur(40px);
        -webkit-backdrop-filter: blur(40px);
        box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.1);
        width: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        max-height: var(--max-height);
        touch-action: none;
        -webkit-user-select: none;
        user-select: none;
        will-change: transform;
        transform: translate3d(0, var(--translate-y), 0);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .sheet-container.dragging {
        transition: none;
    }

    /* Dark mode */
    @media (prefers-color-scheme: dark) {
        .sheet-container {
            background: rgba(26, 26, 26, 0.6);
        }
    }

    /* Mobile styles */
    .sheet-container.mobile {
        border-top-left-radius: 1.5rem;
        border-top-right-radius: 1.5rem;
    }

    /* Desktop styles */
    .sheet-container.desktop {
        border-radius: 0.5rem;
    }

    /* Swipe Indicator */
    .swipe-indicator-wrapper {
        width: 100%;
        display: flex;
        justify-content: center;
        padding-top: 0.75rem;
        padding-bottom: 0.5rem;
        flex-shrink: 0;
        touch-action: none;
        pointer-events: none;
    }

    .swipe-indicator {
        width: 2.5rem;
        height: 0.25rem;
        border-radius: 9999px;
        background-color: rgba(128, 128, 128, 0.3);
        transition: background-color 0.2s;
    }

    .swipe-indicator.active {
        background-color: rgba(128, 128, 128, 0.5);
    }

    @media (prefers-color-scheme: dark) {
        .swipe-indicator {
            background-color: rgba(200, 200, 200, 0.3);
        }

        .swipe-indicator.active {
            background-color: rgba(200, 200, 200, 0.5);
        }
    }

    /* Ensure scrollable content works */
    :global(.sheet-content) {
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        touch-action: pan-y;
    }
</style>
