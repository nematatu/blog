declare module "clsx" {
	export type ClassValue =
		| string
		| number
		| bigint
		| boolean
		| null
		| undefined
		| ClassDictionary
		| ClassArray;
	export interface ClassDictionary {
		[id: string]: unknown;
	}
	export interface ClassArray extends Array<ClassValue> {}
	export function clsx(...inputs: ClassValue[]): string;
	export default clsx;
}

declare module "tailwind-merge" {
	export function twMerge(...inputs: unknown[]): string;
	export default twMerge;
}
