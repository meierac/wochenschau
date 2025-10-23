<script lang="ts">
    import { cn } from "../utils/cn";

    export let variant: "default" | "secondary" | "destructive" | "ghost" =
        "default";
    export let size: "default" | "sm" | "lg" = "default";
    export let disabled = false;

    let className = "";
    export { className as class };

    const variants = {
        default:
            "bg-primary text-primary-foreground hover:bg-primary/90 active:opacity-80",
        secondary:
            "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:opacity-80",
        ghost: "text-foreground hover:bg-muted active:bg-muted/80 transition-colors",
        destructive:
            "bg-destructive text-destructive-foreground shadow-sm active:opacity-90",
    };

    const sizes = {
        default: "h-11 px-6 py-2 text-base",
        sm: "h-9 px-4 py-1 text-sm",
        lg: "h-14 px-8 py-3 text-lg",
    };
</script>

<button
    type="button"
    class={cn(
        "inline-flex items-center justify-center  font-semibold transition-all duration-150",
        "disabled:pointer-events-none disabled:opacity-50",
        "touch-manipulation select-none",
        variants[variant],
        sizes[size],
        className,
    )}
    style="border-radius: 100px;"
    {disabled}
    on:click
    {...$$restProps}
>
    <slot />
</button>
