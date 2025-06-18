/**
 * Event emitted when new data needs to be loaded
 */
export interface IInfiniteScrollEvent {
  /** Index of the first item to be loaded */
  first: number;
  /** Number of items to be loaded */
  rows: number;
  /** Current page number */
  page: number;
}

/**
 * Loading state for the infinite scroll
 */
export interface IInfiniteScrollState {
  /** Indicates whether data is currently loading */
  loading: boolean;
  /** Total number of available records */
  totalRecords: number;
  /** Indicates if there is more data to load */
  hasMore: boolean;
  /** Current page number */
  currentPage: number;
}
