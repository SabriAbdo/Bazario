/// <reference types="vite/client" />

declare module 'stylis' {
  export function prefixer(element: object, index: number, children: object[], callback: Function): void;
}

declare module 'stylis-plugin-rtl' {
  const rtlPlugin: (element: object, index: number, children: object[], callback: Function) => void;
  export default rtlPlugin;
}
