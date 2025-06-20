import { EnumPaginationType } from "../enums";

/**
 * Configuration interface for the infinite scroll component
 */
export interface IScrollConfig {
  /** Height of each item in pixels for virtual scrolling */
  itemHeight: number;
  /** Distance from bottom to trigger load more (default: 200px) */
  threshold?: number;
  /** Debounce time for scroll events in milliseconds (default: 100ms) */
  debounceTime?: number;
  /** Type of pagination to use */
  paginationType: EnumPaginationType;
  /** Initial page size (default: 20) */
  pageSize?: number;
}
