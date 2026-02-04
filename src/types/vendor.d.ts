declare module "clsx" {
  export function clsx(...inputs: any[]): string;
  export type ClassValue = any;
  export default clsx;
}

declare module "tailwind-merge" {
  export function twMerge(...inputs: any[]): string;
  export default twMerge;
}
