<script lang="ts">
  import { cn } from '../utils/cn';
  
  export let chevron = false;
  export let href: string | undefined = undefined;
  
  let className = '';
  export { className as class };
  
  const baseClass = cn(
    'flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0',
    'active:bg-muted transition-colors',
    className
  );
</script>

{#if href}
  <a
    {href}
    class={baseClass}
    {...$$restProps}
  >
    <slot />
    {#if chevron}
      <svg class="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    {/if}
  </a>
{:else}
  <div
    class={baseClass}
    {...$$restProps}
  >
    <slot />
    {#if chevron}
      <svg class="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    {/if}
  </div>
{/if}
