declare module "bundle-text:*" {
  const value: string;
  export default value;
}

declare module "jsx:*.svg" {
  import type { JSX, VNode } from "preact";

  const value: (props: JSX.SVGAttributes) => VNode;
  export default value;
}
