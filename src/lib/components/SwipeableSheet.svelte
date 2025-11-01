<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import { fade } from "svelte/transition";

    export let isDesktop = false;
    export let maxHeight = "90vh";
    export let desktopMaxWidth = "28rem"; // Default: md:max-w-md
    // Height in pixels of the top area that is allowed to initiate a swipe-to-close.
    // You can override this from the parent if you need a different size.
    export let dragZoneHeight = 100;

    const dispatch = createEventDispatcher();

    let startY = 0;
    let currentTranslate = 0;
    let isDragging = false;
    let startTime = 0;
    let containerElement: HTMLElement | null = null;
    let isInDragZone = false;

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
            const touch = e.touches[0];
            if (!touch) return;

            // Determine if touch started inside the drag zone (top dragZoneHeight px of the sheet)
            const rect = node.getBoundingClientRect();
            const offsetY = touch.clientY - rect.top;
            isInDragZone = offsetY <= dragZoneHeight;

            // If not in drag zone, do not prepare for dragging. Allow normal interaction/scrolling.
            if (!isInDragZone) {
                isDragging = false;
                return;
            }

            // Check if touch started on a scrollable element (only needed if in drag zone)
            const target = e.target as HTMLElement;
            scrollableElement = target.closest(".sheet-content") || null;

            initialScrollTop = scrollableElement
                ? scrollableElement.scrollTop
                : 0;

            startY = touch.clientY;
            startX = touch.clientX;
            startTime = Date.now();
            isDragging = false;
            currentTranslate = 0;

            node.style.transition = "none";

            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        }

        function handleMove(e: TouchEvent) {
            // Abort early if the gesture did not begin in the drag zone.
            if (!isInDragZone) return;

            const touch = e.touches[0];
            if (!touch) return;

            const currentY = touch.clientY;
            const currentX = touch.clientX;
            const deltaY = currentY - startY;
            const deltaX = Math.abs(currentX - startX);

            // If touching scrollable content, be conservative
            if (scrollableElement) {
                const currentScrollTop = scrollableElement.scrollTop;
                const isAtTop = currentScrollTop <= 1; // Allow 1px tolerance

                if (
                    !isAtTop || // Not scrolled to very top
                    deltaY <= 0 || // Swiping upward
                    initialScrollTop > 1 || // Started with content scrolled
                    deltaX > 10 // Horizontal movement (likely horizontal scroll)
                ) {
                    return; // Let native scroll happen
                }

                // Require a larger downward movement when starting over scrollable content
                if (deltaY < 40) {
                    return;
                }

                isDragging = true;
            } else {
                // Non-scrollable area inside drag zone
                if (deltaY <= 0) return;
                if (deltaY < 20) return;
                isDragging = true;
            }

            if (isDragging && deltaY > 0) {
                currentTranslate = deltaY;

                if (rafId !== null) {
                    cancelAnimationFrame(rafId);
                }

                rafId = requestAnimationFrame(() => {
                    node.style.transform = `translate3d(0, ${currentTranslate}px, 0)`;
                    rafId = null;
                });

                // Prevent default to stop iOS bounce/overscroll
                e.preventDefault();
                e.stopPropagation();
            }
        }

        function handleEnd() {
            // If gesture didn't start in drag zone, ignore.
            if (!isInDragZone) return;

            if (!isDragging) {
                // Reset zone flag so subsequent touches outside zone work normally
                isInDragZone = false;
                return;
            }

            isDragging = false;
            isInDragZone = false;

            const endTime = Date.now();
            const timeDiff = endTime - startTime;
            const velocity = timeDiff > 0 ? currentTranslate / timeDiff : 0;

            const shouldDismiss = currentTranslate > 120 || velocity > 0.4;

            if (shouldDismiss) {
                node.style.transition = "transform 0.25s ease-out";
                node.style.transform = "translate3d(0, 100vh, 0)";
                setTimeout(() => {
                    dispatch("close");
                }, 250);
            } else {
                node.style.transition =
                    "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
                node.style.transform = "translate3d(0, 0, 0)";
                currentTranslate = 0;
            }
        }

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
        data-drag-zone-height={dragZoneHeight}
    >
        {#if !isDesktop}
            <div
                class="handle-wrapper"
                style={`--drag-zone-height: ${dragZoneHeight}px`}
            >
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
        background: rgba(0, 0, 0, 0.1);
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

    .backdrop.pwa {
        position: fixed;
        overflow: hidden;
        touch-action: none;
    }

    .sheet {
        background: hsl(var(--background) / 0.3);
        backdrop-filter: blur(40px);
        -webkit-backdrop-filter: blur(40px);
        box-shadow:
            0 0px 2px rgba(255, 255, 255, 0.2) inset,
            0 0px 10px rgba(255, 255, 255, 0.05) inset,
            rgba(0, 0, 0, 0.16) 0px 10px 36px 0px,
            rgba(0, 0, 0, 0.06) 0px 0px 0px 1px;
        width: 100%;
        max-width: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform: translate3d(0, 0, 0);
        will-change: transform;
        animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        touch-action: pan-y;
        -webkit-transform: translate3d(0, 0, 0);
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
    }

    .sheet.mobile {
        margin: 5px;
        border-radius: 40px;
    }

    .sheet.desktop {
        border-radius: 40px;
        touch-action: auto;
    }

    .sheet.pwa {
        transform: translate3d(0, 0, 0);
        -webkit-transform: translate3d(0, 0, 0);
        overscroll-behavior: none;
        -webkit-overflow-scrolling: auto;
    }

    .sheet.dragging {
        transition: none !important;
    }

    .handle-wrapper {
        position: absolute;
        top: 0;
        width: 100%;
        display: flex;
        justify-content: center;
        padding: 6px 0 4px 0;
        flex-shrink: 0;
        pointer-events: none;
        touch-action: none;
        /* Visual drag zone hint (optional): uncomment to debug
        background: rgba(255,0,0,0.05);
        height: var(--drag-zone-height, 100px);
        */
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

    :global(.sheet-content) {
        overflow-y: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        touch-action: pan-y;
    }
</style>
