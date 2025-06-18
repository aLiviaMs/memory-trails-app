/**
 * Configuration settings for the infinite scroll component
 */
export interface IInfiniteScrollConfig {
  /** Height of each item in pixels */
  itemSize: number;
  /** Preload buffer (0.1 = 10%) */
  buffer?: number;
  /** Throttling delay in ms */
  delay?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Total height of the container */
  containerHeight?: string;
  /** Custom CSS class */
  customClass?: string;
  /** Show skeleton loader */
  showSkeleton?: boolean;
  /** Number of skeletons to display */
  skeletonCount?: number;
}

/**
 * Default configuration for infinite scroll
 */
export const DEFAULT_INFINITE_SCROLL_CONFIG: Required<IInfiniteScrollConfig> = {
  itemSize: 80,
  buffer: 0.4,
  delay: 250,
  pageSize: 20,
  containerHeight: '500px',
  customClass: '',
  showSkeleton: true,
  skeletonCount: 5
};
