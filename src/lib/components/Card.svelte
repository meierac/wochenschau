<script lang="ts">
  import { cn } from '../utils/cn';
  
  let className = '';
  export { className as class };
</script>

<div
  class={cn(
    'rounded-2xl bg-card text-card-foreground shadow-sm border border-border',
    'backdrop-blur-xl',
    className
  )}
  {...$$restProps}
>
  <slot />
</div>
