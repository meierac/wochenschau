<script lang="ts">
  import { cn } from '../utils/cn';
  
  let className = '';
  export { className as class };
</script>

<div
  class={cn(
    'rounded-2xl bg-card overflow-hidden border border-border',
    className
  )}
  {...$$restProps}
>
  <slot />
</div>
