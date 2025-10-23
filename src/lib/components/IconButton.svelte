<script lang="ts">
    import { cn } from "../utils/cn";

    export let variant: "default" | "secondary" | "ghost" = "ghost";
    export let size: "sm" | "md" | "lg" = "md";
    export let disabled = false;
    export let ariaLabel = "";

    let className = "";
    export { className as class };

    const variants = {
        default:
            "bg-primary text-primary-foreground hover:bg-primary/90 active:opacity-80",
        secondary:
            "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:opacity-80",
        ghost: "text-foreground hover:bg-muted active:bg-muted/80 transition-colors",
    };

    const sizes = {
        sm: "w-8 h-8",
        md: "w-10 h-10",
        lg: "w-12 h-12",
    };
</script>

<button
    style="border-radius: 50%;"
    type="button"
    class={cn(
        "inline-flex items-center justify-center rounded-lg transition-all duration-150",
        "disabled:pointer-events-none disabled:opacity-50",
        "touch-manipulation select-none",
        variants[variant],
        sizes[size],
        className,
    )}
    {disabled}
    aria-label={ariaLabel}
    on:click
    {...$$restProps}
>
    <slot />
</button>
