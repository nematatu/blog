declare module "react" {
  export type ReactNode = any;
  export type ReactElement = any;
  export type RefObject<T = any> = { current: T | null };
  export type Dispatch<A> = (value: A) => void;
  export type SetStateAction<S> = S | ((prevState: S) => S);
  export type ComponentType<P = any> = any;

  export const Children: {
    forEach(children: ReactNode, fn: (child: ReactNode) => void): void;
    map<T>(children: ReactNode, fn: (child: ReactNode) => T): T[];
    toArray(children: ReactNode): ReactNode[];
  };

  export function createContext<T>(defaultValue: T): any;
  export function useContext<T>(context: any): T;
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useLayoutEffect(
    effect: () => void | (() => void),
    deps?: any[]
  ): void;
  export function useMemo<T>(factory: () => T, deps: any[]): T;
  export function useRef<T>(initialValue: T | null): RefObject<T>;
  export function useState<T>(
    initialState: T
  ): [T, Dispatch<SetStateAction<T>>];
  export function useId(): string;
  export function useCallback<T extends (...args: any[]) => any>(
    callback: T,
    deps: any[]
  ): T;
  export function isValidElement(object: any): object is ReactElement;

  const React: any;
  export default React;
}

declare module "react-dom" {
  export function createPortal(children: any, container: any): any;
}

declare module "d3-array" {
  export function bisector<T, U>(
    accessor: (d: T) => U
  ): {
    left: (array: T[], x: U, lo?: number, hi?: number) => number;
  };
}
