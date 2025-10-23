<script lang="ts">
  import { cn } from '../utils/cn';
  
  export let variant: 'default' | 'secondary' | 'destructive' | 'ghost' = 'default';
  export let size: 'default' | 'sm' | 'lg' = 'default';
  export let disabled = false;
  
  let className = '';
  export { className as class };
  
  const variants = {
    default: 'bg-primary text-primary-foreground shadow-sm active:opacity-90',
    secondary: 'bg-secondary text-secondary-foreground shadow-sm active:opacity-80',
    destructive: 'bg-destructive text-destructive-foreground shadow-sm active:opacity-90',
    ghost: 'active:bg-accent active:text-accent-foreground',
  };
  
  const sizes = {
    default: 'h-11 px-6 py-2 text-base',
    sm: 'h-9 px-4 py-1 text-sm',
    lg: 'h-14 px-8 py-3 text-lg',
  };
</script>

<button
  type="button"
  class={cn(
    'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-150',
    'disabled:pointer-events-none disabled:opacity-50',
    'touch-manipulation select-none',
    variants[variant],
    sizes[size],
    className
  )}
  {disabled}
  on:click
  {...$$restProps}
>
  <slot />
</button>
