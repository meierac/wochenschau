# SwipeableSheet Props Documentation

## Overview

The SwipeableSheet component accepts props to customize its appearance and behavior on both mobile and desktop devices.

## Props

### `isDesktop`
- **Type:** `boolean`
- **Default:** `false`
- **Required:** Yes
- **Description:** Determines whether to render the sheet in desktop (centered modal) or mobile (bottom sheet) mode.

**Example:**
```svelte
<SwipeableSheet isDesktop={window.innerWidth >= 768} on:close={handleClose}>
    <Content />
</SwipeableSheet>
```

---

### `maxHeight`
- **Type:** `string`
- **Default:** `"90vh"`
- **Required:** No
- **Description:** Maximum height of the sheet on mobile devices. Accepts any CSS height value.

**Example:**
```svelte
<SwipeableSheet 
    {isDesktop} 
    maxHeight="95vh"
    on:close={handleClose}
>
    <TallerContent />
</SwipeableSheet>
```

**Common values:**
- `"90vh"` - Default, leaves some space at top
- `"95vh"` - Taller, for content-heavy sheets
- `"80vh"` - Shorter, for simple dialogs
- `"calc(100vh - 60px)"` - Custom calculation

---

### `desktopMaxWidth`
- **Type:** `string`
- **Default:** `"28rem"` (448px, equivalent to Tailwind's `md:max-w-md`)
- **Required:** No
- **Description:** Maximum width of the sheet when displayed on desktop. Accepts any CSS width value.

**Example:**
```svelte
<SwipeableSheet 
    {isDesktop} 
    desktopMaxWidth="56rem"
    on:close={handleClose}
>
    <WideContent />
</SwipeableSheet>
```

**Common values:**
- `"28rem"` (448px) - Default, narrow modal for simple forms
- `"42rem"` (672px) - Medium width for standard content
- `"56rem"` (896px) - Wide modal for complex forms or tables
- `"64rem"` (1024px) - Extra wide for dashboards
- `"90%"` - Responsive percentage width
- `"calc(100vw - 4rem)"` - Full width minus margin

**Tailwind equivalents:**
- `"20rem"` = `max-w-xs` (320px)
- `"24rem"` = `max-w-sm` (384px)
- `"28rem"` = `max-w-md` (448px) ← Default
- `"32rem"` = `max-w-lg` (512px)
- `"36rem"` = `max-w-xl` (576px)
- `"42rem"` = `max-w-2xl` (672px)
- `"48rem"` = `max-w-3xl` (768px)
- `"56rem"` = `max-w-4xl` (896px)
- `"64rem"` = `max-w-5xl` (1024px)

---

## Events

### `close`
- **Payload:** None
- **Description:** Fired when the sheet should be closed (backdrop click, ESC key, or swipe dismiss on mobile).

**Example:**
```svelte
<script>
    let showSheet = false;
    
    function handleClose() {
        showSheet = false;
        // Optional: perform cleanup
    }
</script>

{#if showSheet}
    <SwipeableSheet {isDesktop} on:close={handleClose}>
        <Content />
    </SwipeableSheet>
{/if}
```

---

## Usage Examples

### Simple Dialog (Default Width)
```svelte
<SwipeableSheet {isDesktop} on:close={() => showDialog = false}>
    <div class="p-6">
        <h2>Simple Dialog</h2>
        <p>This uses the default 28rem width on desktop.</p>
    </div>
</SwipeableSheet>
```

### Settings Panel (Wide)
```svelte
<SwipeableSheet 
    {isDesktop} 
    desktopMaxWidth="56rem"
    on:close={() => showSettings = false}
>
    <div class="p-6">
        <h2>Settings</h2>
        <div class="grid grid-cols-2 gap-4">
            <!-- Wide layout with multiple columns -->
        </div>
    </div>
</SwipeableSheet>
```

### Export Preview (Extra Wide)
```svelte
<SwipeableSheet 
    {isDesktop}
    maxHeight="95vh"
    desktopMaxWidth="64rem"
    on:close={() => showExport = false}
>
    <div class="p-6">
        <h2>Export Preview</h2>
        <!-- Large preview area -->
    </div>
</SwipeableSheet>
```

### Activity Edit (Tall Mobile)
```svelte
<SwipeableSheet 
    {isDesktop}
    maxHeight="95vh"
    desktopMaxWidth="28rem"
    on:close={() => showEdit = false}
>
    <div class="p-6">
        <h2>Edit Activity</h2>
        <form>
            <!-- Form fields -->
        </form>
    </div>
</SwipeableSheet>
```

---

## Responsive Design Guidelines

### When to Use Different Widths

**Narrow (20rem - 28rem):**
- Simple forms (login, signup)
- Confirmation dialogs
- Single input modals
- Activity edit sheets

**Medium (32rem - 42rem):**
- Multi-field forms
- User profile editing
- Standard content display
- Search filters

**Wide (48rem - 56rem):**
- Complex settings panels
- Data tables
- Multi-column layouts
- Export configurations

**Extra Wide (64rem+):**
- Dashboard modals
- Large data grids
- Preview panels
- Side-by-side comparisons

---

## Best Practices

### 1. Consistent Widths
Use consistent widths across similar types of sheets in your app:
```svelte
<!-- All settings sheets -->
<SwipeableSheet desktopMaxWidth="56rem">

<!-- All edit forms -->
<SwipeableSheet desktopMaxWidth="28rem">

<!-- All preview dialogs -->
<SwipeableSheet desktopMaxWidth="64rem">
```

### 2. Mobile Height
Leave space at the top on mobile for better UX:
```svelte
<!-- Good: 90-95vh leaves space -->
<SwipeableSheet maxHeight="90vh">

<!-- Avoid: 100vh feels cramped -->
<SwipeableSheet maxHeight="100vh">
```

### 3. Content-Aware Sizing
Size the sheet based on typical content:
```svelte
<!-- Form with 3-5 fields: small -->
<SwipeableSheet desktopMaxWidth="28rem">

<!-- Form with 10+ fields or tabs: medium -->
<SwipeableSheet desktopMaxWidth="42rem">

<!-- Table or grid: wide -->
<SwipeableSheet desktopMaxWidth="56rem">
```

### 4. Responsive Breakpoints
Consider using viewport-relative widths for tablets:
```svelte
<!-- 90% width on tablets, max 56rem on desktop -->
<SwipeableSheet desktopMaxWidth="min(90vw, 56rem)">
```

---

## Implementation Notes

### How It Works

The `desktopMaxWidth` prop is applied via inline styles only when `isDesktop` is true:

```svelte
<div
    class="sheet"
    style:max-width={isDesktop ? desktopMaxWidth : "100%"}
>
```

**Mobile:** Always 100% width (full screen bottom sheet)
**Desktop:** Uses `desktopMaxWidth` value with `max-width` CSS property

### CSS Priority

The inline style `max-width` takes precedence over CSS classes, ensuring your custom width is always applied:

```svelte
<!-- This works correctly -->
<SwipeableSheet desktopMaxWidth="42rem">
  <!-- Sheet will be 42rem max, even with conflicting classes -->
</SwipeableSheet>
```

---

## Migration from Previous Versions

If you were using the old prop names or Tailwind classes:

### Old (Removed)
```svelte
<!-- Tailwind class approach (no longer supported) -->
<SwipeableSheet desktopMaxWidth="md:max-w-4xl">

<!-- Old prop name (removed) -->
<SwipeableSheet maxDesktopWidth="900px">
```

### New (Current)
```svelte
<!-- Use CSS values directly -->
<SwipeableSheet desktopMaxWidth="56rem">

<!-- Or pixels -->
<SwipeableSheet desktopMaxWidth="896px">

<!-- Or viewport units -->
<SwipeableSheet desktopMaxWidth="80vw">
```

---

## Summary

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `isDesktop` | `boolean` | `false` | Toggle mobile/desktop layout |
| `maxHeight` | `string` | `"90vh"` | Mobile sheet max height |
| `desktopMaxWidth` | `string` | `"28rem"` | Desktop modal max width |

**Example with all props:**
```svelte
<SwipeableSheet 
    isDesktop={window.innerWidth >= 768}
    maxHeight="95vh"
    desktopMaxWidth="56rem"
    on:close={() => showSheet = false}
>
    <YourContent />
</SwipeableSheet>
```

---

**Version:** 4.0.0  
**Last Updated:** 2024