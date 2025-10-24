/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module "html-to-image" {
  interface Options {
    quality?: number;
    width?: number;
    height?: number;
    backgroundColor?: string | null;
    style?: Partial<CSSStyleDeclaration>;
    filter?: (node: Node) => boolean;
    cacheBust?: boolean;
    imagePlaceholder?: string;
    pixelRatio?: number;
    preferredFontFormat?: string;
    skipAutoScale?: boolean;
    skipFonts?: boolean;
  }

  export function toBlob(
    node: HTMLElement,
    options?: Options,
  ): Promise<Blob | null>;

  export function toPng(node: HTMLElement, options?: Options): Promise<string>;

  export function toJpeg(node: HTMLElement, options?: Options): Promise<string>;

  export function toSvg(node: HTMLElement, options?: Options): Promise<string>;

  export function toPixelData(
    node: HTMLElement,
    options?: Options,
  ): Promise<Uint8ClampedArray>;

  export function toCanvas(
    node: HTMLElement,
    options?: Options,
  ): Promise<HTMLCanvasElement>;
}
