<script lang="ts">
  import { cn } from '../utils/cn';
  
  export let value = '';
  export let type: 'text' | 'email' | 'password' | 'number' | 'search' = 'text';
  export let placeholder = '';
  export let disabled = false;
  
  let className = '';
  export { className as class };
</script>

<input
  {type}
  {placeholder}
  {disabled}
  bind:value
  class={cn(
    'flex h-11 w-full rounded-lg border border-input bg-transparent px-4 py-2 text-base',
    'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
    'placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'transition-all duration-150',
    className
  )}
  on:input
  on:change
  on:focus
  on:blur
  {...$$restProps}
/>
