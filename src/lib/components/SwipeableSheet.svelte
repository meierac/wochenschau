<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import { fade } from "svelte/transition";

    export let isDesktop = false;
    export let maxHeight = "90vh";
    export let desktopMaxWidth = "28rem"; // Default: md:max-w-md

    const dispatch = createEventDispatcher();

    let startY = 0;
    let currentTranslate = 0;
    let isDragging = false;
    let startTime = 0;
    let containerElement: HTMLElement | null = null;

    // Detect PWA standalone mode
    const isStandalone =
        typeof window !== "undefined" &&
        (window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as any).standalone === true);

    function swipeAction(node: HTMLElement) {
        if (isDesktop) return {};

        let rafId: number | null = null;
        let scrollableElement: HTMLElement | null = null;
        let initialScrollTop = 0;
        let startX = 0;

        function handleStart(e: TouchEvent) {
            // Don't prevent default on start to allow clicks
            const touch = e.touches[0];
            if (!touch) return;

            // Check if touch started on a scrollable element
            const target = e.target as HTMLElement;
            scrollableElement = target.closest(".sheet-content");

            // Store initial scroll position
            initialScrollTop = scrollableElement
                ? scrollableElement.scrollTop
                : 0;

            startY = touch.clientY;
            startX = touch.clientX;
            startTime = Date.now();
            isDragging = false;
            currentTranslate = 0;

            // Remove any transitions
            node.style.transition = "none";

            // Cancel any pending animation
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        }

        function handleMove(e: TouchEvent) {
            const touch = e.touches[0];
            if (!touch) return;

            const currentY = touch.clientY;
            const currentX = touch.clientX;
            const deltaY = currentY - startY;
            const deltaX = Math.abs(currentX - startX);

            // If touching scrollable content, be very conservative
            if (scrollableElement) {
                const currentScrollTop = scrollableElement.scrollTop;
                const isAtTop = currentScrollTop <= 1; // Allow 1px tolerance

                // Don't allow swipe-to-close if:
                // 1. Not at the very top
                // 2. Swiping up
                // 3. Didn't start at top
                // 4. Horizontal movement detected (likely scrolling)
                if (
                    !isAtTop ||
                    deltaY <= 0 ||
                    initialScrollTop > 1 ||
                    deltaX > 10
                ) {
                    return; // Let the browser handle scrolling
                }

                // Require significant downward movement (40px) before triggering
                if (deltaY < 40) {
                    return;
                }

                // At this point, user is clearly trying to close, not scroll
                isDragging = true;
            } else {
                // No scrollable content, allow swipe with lower threshold
                if (deltaY <= 0) return;
                if (deltaY < 20) return;
                isDragging = true;
            }

            if (isDragging && deltaY > 0) {
                currentTranslate = deltaY;

                // Update transform immediately using RAF
                if (rafId !== null) {
                    cancelAnimationFrame(rafId);
                }

                rafId = requestAnimationFrame(() => {
                    node.style.transform = `translate3d(0, ${currentTranslate}px, 0)`;
                    rafId = null;
                });

                // Prevent default to stop iOS bounce/overscroll in PWA
                e.preventDefault();
                e.stopPropagation();
            }
        }

        function handleEnd() {
            if (!isDragging) return;

            isDragging = false;

            const endTime = Date.now();
            const timeDiff = endTime - startTime;
            const velocity = timeDiff > 0 ? currentTranslate / timeDiff : 0;

            // Dismiss if:
            // 1. Dragged more than 120px (slightly higher threshold for PWA)
            // 2. Fast swipe (velocity > 0.4)
            const shouldDismiss = currentTranslate > 120 || velocity > 0.4;

            if (shouldDismiss) {
                // Animate out
                node.style.transition = "transform 0.25s ease-out";
                node.style.transform = "translate3d(0, 100vh, 0)";

                setTimeout(() => {
                    dispatch("close");
                }, 250);
            } else {
                // Snap back
                node.style.transition =
                    "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
                node.style.transform = "translate3d(0, 0, 0)";
                currentTranslate = 0;
            }
        }

        // For PWA mode, we need to be more aggressive with touch handling
        const passiveOption = { passive: false };
        const passiveTrue = { passive: true };

        node.addEventListener("touchstart", handleStart, passiveTrue);
        node.addEventListener("touchmove", handleMove, passiveOption);
        node.addEventListener("touchend", handleEnd, passiveTrue);
        node.addEventListener("touchcancel", handleEnd, passiveTrue);

        return {
            destroy() {
                if (rafId !== null) {
                    cancelAnimationFrame(rafId);
                }
                node.removeEventListener("touchstart", handleStart);
                node.removeEventListener("touchmove", handleMove);
                node.removeEventListener("touchend", handleEnd);
                node.removeEventListener("touchcancel", handleEnd);
            },
        };
    }

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            dispatch("close");
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            dispatch("close");
        }
    }

    onMount(() => {
        if (!isDesktop) {
            // In PWA mode, prevent body scroll more aggressively
            const scrollY = window.scrollY;
            const originalOverflow = document.body.style.overflow;
            const originalPosition = document.body.style.position;
            const originalTop = document.body.style.top;
            const originalWidth = document.body.style.width;
            const originalTouchAction = document.body.style.touchAction;

            document.body.style.overflow = "hidden";
            document.body.style.position = "fixed";
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = "100%";
            document.body.style.touchAction = "none";

            // Also prevent touch on the backdrop container
            if (containerElement) {
                containerElement.style.touchAction = "none";
            }

            return () => {
                document.body.style.overflow = originalOverflow;
                document.body.style.position = originalPosition;
                document.body.style.top = originalTop;
                document.body.style.width = originalWidth;
                document.body.style.touchAction = originalTouchAction;
                window.scrollTo(0, scrollY);
            };
        }
    });
</script>

<svelte:window on:keydown={handleKeydown} />

<div
    bind:this={containerElement}
    class="backdrop"
    class:desktop={isDesktop}
    class:pwa={isStandalone}
    on:click={handleBackdropClick}
    role="presentation"
    transition:fade={{ duration: 200 }}
>
    <div
        use:swipeAction
        class="sheet"
        class:desktop={isDesktop}
        class:mobile={!isDesktop}
        class:dragging={isDragging}
        class:pwa={isStandalone}
        style:max-height={isDesktop ? "80vh" : maxHeight}
        style:max-width={isDesktop ? desktopMaxWidth : "600px"}
        role="dialog"
        aria-modal="true"
    >
        {#if !isDesktop}
            <div class="handle-wrapper">
                <div class="handle" class:active={isDragging}></div>
            </div>
        {/if}

        <slot />
    </div>
</div>

<style>
    .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 50;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        touch-action: none;
        -webkit-user-select: none;
        user-select: none;
        overscroll-behavior: none;
        -webkit-overflow-scrolling: auto;
    }

    .backdrop.desktop {
        align-items: center;
    }

    /* PWA-specific fixes */
    .backdrop.pwa {
        /* Prevent iOS overscroll in standalone mode */
        position: fixed;
        overflow: hidden;
        touch-action: none;
    }

    .sheet {
        background: hsl(var(--card) / 0.6);
        backdrop-filter: blur(40px);
        -webkit-backdrop-filter: blur(40px);
        box-shadow:
            0 -4px 24px rgba(0, 0, 0, 0.2),
            0 0 0 1px hsl(var(--border) / 0.9);
        width: 100%;
        max-width: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform: translate3d(0, 0, 0);
        will-change: transform;
        animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        /* Critical for PWA */
        position: relative;
        touch-action: pan-y;
        -webkit-transform: translate3d(0, 0, 0);
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
    }

    .sheet.mobile {
        margin: 5px;
        border-radius: 38px;
    }

    .sheet.desktop {
        border-radius: 38px;
        touch-action: auto;
    }

    /* PWA-specific sheet fixes */
    .sheet.pwa {
        /* Force GPU acceleration in PWA mode */
        transform: translate3d(0, 0, 0);
        -webkit-transform: translate3d(0, 0, 0);
        /* Prevent iOS rubber banding */
        overscroll-behavior: none;
        -webkit-overflow-scrolling: auto;
    }

    /* Remove transition when actively dragging */
    .sheet.dragging {
        transition: none !important;
    }

    .handle-wrapper {
        position: absolute;
        top: 0;
        width: 100%;
        display: flex;
        justify-content: center;
        padding: 3px 0 0px 0;
        flex-shrink: 0;
        pointer-events: none;
        touch-action: none;
    }

    .handle {
        width: 80px;
        height: 4px;
        border-radius: 2px;
        background: hsl(var(--muted-foreground) / 0.3);
        transition: background 0.2s;
    }

    .handle.active {
        background: hsl(var(--muted-foreground) / 0.5);
    }

    @keyframes slideUp {
        from {
            transform: translate3d(0, 100%, 0);
        }
        to {
            transform: translate3d(0, 0, 0);
        }
    }

    /* Scrollable content within sheet */
    :global(.sheet-content) {
        overflow-y: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        touch-action: pan-y;
    }
</style>
