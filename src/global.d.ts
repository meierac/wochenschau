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

declare module "@zumer/snapdom" {
  interface LocalFont {
    family: string;
    src: string;
    weight?: number | string;
    style?: string;
  }

  interface ExcludeFonts {
    families?: string[];
    domains?: string[];
    subsets?: string[];
  }

  interface SnapdomOptions {
    fast?: boolean;
    embedFonts?: boolean;
    localFonts?: LocalFont[];
    iconFonts?: string | RegExp | (string | RegExp)[];
    excludeFonts?: ExcludeFonts;
    scale?: number;
    dpr?: number;
    width?: number;
    height?: number;
    backgroundColor?: string;
    quality?: number;
    useProxy?: string;
    type?: "svg" | "png" | "jpg" | "webp";
    exclude?: string[];
    excludeMode?: "hide" | "remove";
    filter?: (el: Element) => boolean;
    filterMode?: "hide" | "remove";
    cache?: "disabled" | "soft" | "auto" | "full";
    placeholders?: boolean;
    fallbackURL?:
      | string
      | ((dimensions: { width?: number; height?: number }) => string);
    straighten?: boolean;
    noShadows?: boolean;
  }

  interface SnapdomResult {
    url: string;
    toRaw(): string;
    toImg(): Promise<HTMLImageElement>;
    toSvg(): Promise<HTMLImageElement>;
    toCanvas(): Promise<HTMLCanvasElement>;
    toBlob(options?: SnapdomOptions): Promise<Blob>;
    toPng(options?: SnapdomOptions): Promise<HTMLImageElement>;
    toJpg(options?: SnapdomOptions): Promise<HTMLImageElement>;
    toWebp(options?: SnapdomOptions): Promise<HTMLImageElement>;
    download(
      options?: SnapdomOptions & {
        filename?: string;
        format?: "svg" | "png" | "jpg" | "webp";
      },
    ): Promise<void>;
  }

  export function snapdom(
    el: HTMLElement,
    options?: SnapdomOptions,
  ): Promise<SnapdomResult>;

  export namespace snapdom {
    export function toImg(
      el: HTMLElement,
      options?: SnapdomOptions,
    ): Promise<HTMLImageElement>;
    export function toSvg(
      el: HTMLElement,
      options?: SnapdomOptions,
    ): Promise<HTMLImageElement>;
    export function toCanvas(
      el: HTMLElement,
      options?: SnapdomOptions,
    ): Promise<HTMLCanvasElement>;
    export function toBlob(
      el: HTMLElement,
      options?: SnapdomOptions,
    ): Promise<Blob>;
    export function toPng(
      el: HTMLElement,
      options?: SnapdomOptions,
    ): Promise<HTMLImageElement>;
    export function toJpg(
      el: HTMLElement,
      options?: SnapdomOptions,
    ): Promise<HTMLImageElement>;
    export function toWebp(
      el: HTMLElement,
      options?: SnapdomOptions,
    ): Promise<HTMLImageElement>;
    export function download(
      el: HTMLElement,
      options?: SnapdomOptions & {
        filename?: string;
        format?: "svg" | "png" | "jpg" | "webp";
      },
    ): Promise<void>;
  }

  export function preCache(
    options?: SnapdomOptions & { root?: HTMLElement },
  ): Promise<void>;
}
