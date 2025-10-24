<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import { fade } from "svelte/transition";

    export let isDesktop = false;
    export let maxHeight = "90vh";

    const dispatch = createEventDispatcher();

    let startY = 0;
    let currentTranslate = 0;
    let isDragging = false;
    let startTime = 0;

    function swipeAction(node: HTMLElement) {
        if (isDesktop) return {};

        let animationFrame: number | undefined;

        function handleStart(e: TouchEvent) {
            const touch = e.touches[0];
            startY = touch.clientY;
            startTime = Date.now();
            isDragging = true;
            currentTranslate = 0;

            // Cancel any ongoing animation
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }
        }

        function handleMove(e: TouchEvent) {
            if (!isDragging) return;

            const touch = e.touches[0];
            const deltaY = touch.clientY - startY;

            // Only allow downward swipes
            if (deltaY > 0) {
                currentTranslate = deltaY;

                // Update transform directly
                requestAnimationFrame(() => {
                    node.style.transform = `translateY(${currentTranslate}px)`;
                });

                // Prevent scroll if dragging significantly
                if (deltaY > 10) {
                    e.preventDefault();
                }
            }
        }

        function handleEnd() {
            if (!isDragging) return;

            isDragging = false;
            const endTime = Date.now();
            const timeDiff = endTime - startTime;
            const velocity = currentTranslate / timeDiff;

            // Dismiss if:
            // 1. Dragged more than 100px
            // 2. Fast swipe (velocity > 0.5)
            if (currentTranslate > 100 || velocity > 0.5) {
                // Animate out then close
                node.style.transition = "transform 0.25s ease-out";
                node.style.transform = "translateY(100vh)";
                setTimeout(() => {
                    dispatch("close");
                }, 250);
            } else {
                // Snap back
                node.style.transition =
                    "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
                node.style.transform = "translateY(0)";
                currentTranslate = 0;
            }
        }

        // Add listeners with passive: false
        node.addEventListener("touchstart", handleStart, { passive: true });
        node.addEventListener("touchmove", handleMove, { passive: false });
        node.addEventListener("touchend", handleEnd, { passive: true });
        node.addEventListener("touchcancel", handleEnd, { passive: true });

        return {
            destroy() {
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
            document.body.style.overflow = "hidden";
            document.body.style.position = "fixed";
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = "100%";

            return () => {
                document.body.style.overflow = "";
                document.body.style.position = "";
                document.body.style.top = "";
                document.body.style.width = "";
                window.scrollTo(0, scrollY);
            };
        }
    });
</script>

<svelte:window on:keydown={handleKeydown} />

<div
    class="backdrop"
    class:desktop={isDesktop}
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
        style:max-height={isDesktop ? "80vh" : maxHeight}
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
    }

    .backdrop.desktop {
        align-items: center;
    }

    .sheet {
        background: hsl(var(--card) / 0.6);
        backdrop-filter: blur(40px);
        -webkit-backdrop-filter: blur(40px);
        box-shadow:
            0 -4px 24px rgba(0, 0, 0, 0.2),
            0 0 0 1px rgba(255, 255, 255, 0.1);
        width: 100%;
        max-width: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform: translateY(0);
        will-change: transform;
        /* Animation for initial slide up */
        animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .sheet.mobile {
        border-top-left-radius: 24px;
        border-top-right-radius: 24px;
        touch-action: pan-y;
    }

    .sheet.desktop {
        border-radius: 8px;
        max-width: 28rem; /* md:max-w-md default */
        touch-action: auto;
    }

    /* Remove transition when actively dragging */
    .sheet.dragging {
        transition: none !important;
    }

    .handle-wrapper {
        width: 100%;
        display: flex;
        justify-content: center;
        padding: 12px 0 8px 0;
        flex-shrink: 0;
        pointer-events: none;
    }

    .handle {
        width: 40px;
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
            transform: translateY(100%);
        }
        to {
            transform: translateY(0);
        }
    }

    /* Ensure child content can scroll */
    :global(.sheet-content) {
        overflow-y: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
    }
</style>
