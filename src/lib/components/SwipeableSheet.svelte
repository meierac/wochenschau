<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import { fly, fade } from "svelte/transition";
    import { quintOut } from "svelte/easing";

    export let isDesktop = false;
    export let maxHeight = "90vh";
    export let desktopMaxWidth = "md:max-w-md";
    export let padding = "p-2";

    const dispatch = createEventDispatcher();

    let isDragging = false;
    let startY = 0;
    let currentY = 0;
    let translateY = 0;
    let velocity = 0;
    let lastTime = 0;
    let lastY = 0;

    const SWIPE_THRESHOLD = 100;
    const VELOCITY_THRESHOLD = 0.5;

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            dispatch("close");
        }
    }

    function findScrollableParent(
        element: HTMLElement,
        sheetEl: HTMLElement,
    ): HTMLElement | null {
        let current = element;
        while (current && current !== sheetEl) {
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

    function handleTouchStart(e: TouchEvent, sheetEl: HTMLElement) {
        if (isDesktop) return;

        const target = e.target as HTMLElement;
        const scrollableParent = findScrollableParent(target, sheetEl);

        if (scrollableParent && scrollableParent.scrollTop > 0) {
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

    function handleTouchMove(e: TouchEvent, sheetEl: HTMLElement) {
        if (!isDragging || isDesktop) return;

        const touch = e.touches[0];
        currentY = touch.clientY;
        const deltaY = currentY - startY;

        const target = e.target as HTMLElement;
        const scrollableParent = findScrollableParent(target, sheetEl);

        if (deltaY > 0) {
            if (!scrollableParent || scrollableParent.scrollTop === 0) {
                translateY = deltaY;

                const now = Date.now();
                const timeDiff = now - lastTime;
                if (timeDiff > 0) {
                    velocity = (currentY - lastY) / timeDiff;
                }
                lastY = currentY;
                lastTime = now;

                if (deltaY > 5) {
                    e.preventDefault();
                }
            }
        } else if (
            deltaY < 0 &&
            scrollableParent &&
            scrollableParent.scrollTop === 0
        ) {
            isDragging = false;
            translateY = 0;
        }
    }

    function handleTouchEnd() {
        if (!isDragging || isDesktop) return;

        isDragging = false;

        if (translateY > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD) {
            dispatch("close");
        } else {
            translateY = 0;
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            dispatch("close");
        }
    }

    function touchHandler(node: HTMLElement) {
        if (isDesktop) return {};

        const onTouchStart = (e: TouchEvent) => handleTouchStart(e, node);
        const onTouchMove = (e: TouchEvent) => handleTouchMove(e, node);
        const onTouchEnd = () => handleTouchEnd();

        node.addEventListener("touchstart", onTouchStart, { passive: false });
        node.addEventListener("touchmove", onTouchMove, { passive: false });
        node.addEventListener("touchend", onTouchEnd, { passive: false });
        node.addEventListener("touchcancel", onTouchEnd, { passive: false });

        return {
            destroy() {
                node.removeEventListener("touchstart", onTouchStart);
                node.removeEventListener("touchmove", onTouchMove);
                node.removeEventListener("touchend", onTouchEnd);
                node.removeEventListener("touchcancel", onTouchEnd);
            },
        };
    }

    onMount(() => {
        if (!isDesktop) {
            const originalOverflow = document.body.style.overflow;
            const originalPosition = document.body.style.position;
            const originalWidth = document.body.style.width;

            document.body.style.overflow = "hidden";
            document.body.style.position = "fixed";
            document.body.style.width = "100%";

            return () => {
                document.body.style.overflow = originalOverflow;
                document.body.style.position = originalPosition;
                document.body.style.width = originalWidth;
            };
        }
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
        use:touchHandler
        class="bg-card/60 backdrop-blur-xl shadow-lg w-full flex flex-col {isDesktop
            ? desktopMaxWidth + ' rounded-lg'
            : 'rounded-t-3xl'}"
        style="box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1); max-height: {isDesktop
            ? '80vh'
            : maxHeight}; transform: translate3d(0, {translateY}px, 0); transition: {isDragging
            ? 'none'
            : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'}; touch-action: none; -webkit-user-select: none; user-select: none;"
        in:fly={{ y: isDesktop ? 0 : 500, duration: 300, easing: quintOut }}
        out:fly={{ y: isDesktop ? 0 : 500, duration: 250, easing: quintOut }}
    >
        {#if !isDesktop}
            <div
                class="w-full flex justify-center pt-3 pb-2"
                style="touch-action: none;"
            >
                <div
                    class="w-10 h-1 rounded-full bg-muted-foreground/30"
                    style="transition: background-color 0.2s; {isDragging
                        ? 'background-color: rgb(var(--muted-foreground) / 0.5);'
                        : ''}"
                ></div>
            </div>
        {/if}

        <slot />
    </div>
</div>

<style>
    :global(.sheet-content) {
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
    }
</style>
