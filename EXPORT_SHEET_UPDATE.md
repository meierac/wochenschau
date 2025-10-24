# ExportSheet.svelte - Updated embedFontsAsBase64 Function

## Instructions

Replace the `embedFontsAsBase64()` function in `src/lib/components/ExportSheet.svelte` with this implementation:

---

## New Implementation (Lines ~128-254)

```typescript
async function embedFontsAsBase64(): Promise<HTMLStyleElement | null> {
    try {
        console.log("[ExportSheet] Embedding local fonts as base64...");

        const fontsToEmbed = [
            $exportSettings.headerFontFamily,
            $exportSettings.bodyFontFamily,
        ];

        // Remove duplicates
        const uniqueFonts = [...new Set(fontsToEmbed)];

        // Map font family names to their local file paths
        const FONT_FILE_MAP: Record<string, string> = {
            "Archivo": "/fonts/Archivo-VariableFont_wdth,wght.ttf",
            "Dancing Script": "/fonts/DancingScript-VariableFont_wght.ttf",
            "Edu QLD Hand": "/fonts/EduQLDHand-VariableFont_wght.ttf",
            "Edu SA Hand": "/fonts/EduSAHand-VariableFont_wght.ttf",
            "Handlee": "/fonts/Handlee-Regular.ttf",
            "Lora": "/fonts/Lora-VariableFont_wght.ttf",
            "Manrope": "/fonts/Manrope-VariableFont_wght.ttf",
            "Ms Madi": "/fonts/MsMadi-Regular.ttf",
            "Noto Sans": "/fonts/NotoSans-VariableFont_wdth,wght.ttf",
            "Pirata One": "/fonts/PirataOne-Regular.ttf",
            "Space Mono": "/fonts/SpaceMono-Regular.ttf",
        };

        let fontFaceCSS = "";

        for (const fontFamily of uniqueFonts) {
            // Extract font name from family string (e.g., "'Lora', serif" -> "Lora")
            const fontMatch = fontFamily.match(/'([^']+)'/);
            if (!fontMatch) {
                console.log(`[ExportSheet] Skipping font family: ${fontFamily} (no match)`);
                continue;
            }

            const fontName = fontMatch[1];
            console.log(`[ExportSheet] Processing font: ${fontName}`);

            // Get the font file path
            const fontPath = FONT_FILE_MAP[fontName];
            if (!fontPath) {
                console.warn(`[ExportSheet] Font file not found for: ${fontName}`);
                continue;
            }

            try {
                console.log(`[ExportSheet] Fetching font file: ${fontPath}`);

                // Fetch the local font file
                const response = await fetch(fontPath);
                if (!response.ok) {
                    console.warn(`[ExportSheet] Failed to fetch font: ${fontPath}`);
                    continue;
                }

                const arrayBuffer = await response.arrayBuffer();

                // Convert to base64
                const base64 = btoa(
                    new Uint8Array(arrayBuffer).reduce(
                        (data, byte) => data + String.fromCharCode(byte),
                        "",
                    ),
                );

                console.log(`[ExportSheet] Font converted to base64 (${base64.length} chars)`);

                // Create @font-face rule with embedded font
                // Using font-weight 100 900 to support all weights for variable fonts
                fontFaceCSS += `
                    @font-face {
                        font-family: '${fontName}';
                        src: url(data:font/truetype;base64,${base64}) format('truetype');
                        font-weight: 100 900;
                        font-style: normal;
                        font-display: block;
                    }
                `;

                console.log(`[ExportSheet] Successfully embedded font: ${fontName}`);
            } catch (error) {
                console.error(`[ExportSheet] Failed to process font ${fontName}:`, error);
            }
        }

        if (fontFaceCSS) {
            // Create and inject style element with embedded fonts
            const style = document.createElement("style");
            style.setAttribute("data-font-embed", "true");
            style.textContent = fontFaceCSS;
            document.head.appendChild(style);
            console.log("[ExportSheet] Font embedding complete");
            return style;
        }

        console.log("[ExportSheet] No fonts to embed");
        return null;
    } catch (error) {
        console.error("[ExportSheet] Font embedding failed:", error);
        return null;
    }
}
```

---

## Key Changes

1. **Removed Google Fonts dependency** - No longer tries to fetch from `fonts.googleapis.com`
2. **Direct file mapping** - Uses a simple map of font names to local file paths
3. **Simplified logic** - No need to parse CSS, just fetch and encode
4. **Variable font support** - Uses `font-weight: 100 900` to support all weights
5. **Better error handling** - Continues if one font fails, others still load

---

## Benefits

✅ **Faster** - No external network requests  
✅ **More reliable** - No CORS or network issues  
✅ **Simpler** - Less code, easier to maintain  
✅ **Offline support** - Works completely offline  
✅ **Better quality** - TTF fonts embed perfectly  

---

## Testing

After updating, test the export function:

1. Set header font to "Lora"
2. Set body font to "Manrope"
3. Export an image
4. Verify fonts appear correctly in the exported PNG
5. Check console for successful embedding messages

Expected console output:
```
[ExportSheet] Embedding local fonts as base64...
[ExportSheet] Processing font: Lora
[ExportSheet] Fetching font file: /fonts/Lora-VariableFont_wght.ttf
[ExportSheet] Font converted to base64 (xxxxx chars)
[ExportSheet] Successfully embedded font: Lora
[ExportSheet] Processing font: Manrope
[ExportSheet] Fetching font file: /fonts/Manrope-VariableFont_wght.ttf
[ExportSheet] Font converted to base64 (xxxxx chars)
[ExportSheet] Successfully embedded font: Manrope
[ExportSheet] Font embedding complete
```

---

## Adding More Fonts

To add more fonts to the system:

1. Add the TTF file to `public/fonts/`
2. Add the font to `src/fonts.css` with @font-face
3. Add the mapping to `FONT_FILE_MAP` in this function
4. Add the font option to `FONT_FAMILIES` in `exportSettings.ts`

Example:
```typescript
"MyNewFont": "/fonts/MyNewFont-Variable.ttf",
```

---

**Status:** Ready to implement  
**Estimated time:** 2 minutes to copy/paste  
**Risk:** Low - fallback to system fonts if issues  
**Impact:** Major improvement in speed and reliability