// General utility types
import { SanityAsset } from "@sanity/image-url";

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

// Image component props
export interface IdealImageProps {
  image?: SanityAsset;
  alt?: string;
  className?: string;
}

export interface IdealImageClientProps {
  alt?: string;
  className?: string;
  src?: string;
  width?: number;
  height?: number;
  blurDataURL?: string;
  /** Ignored when `src` is already optimized server-side; kept for `LogoData` spread parity. */
  widthHint?: number;
  sizes?: string;
  quality?: number;
  priority?: boolean;
}

// Common utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
