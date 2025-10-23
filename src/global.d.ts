/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module "html2canvas" {
  interface Options {
    backgroundColor?: string;
    scale?: number;
    useCORS?: boolean;
    allowTaint?: boolean;
  }

  function html2canvas(
    element: HTMLElement,
    options?: Options,
  ): Promise<HTMLCanvasElement>;

  export default html2canvas;
}
