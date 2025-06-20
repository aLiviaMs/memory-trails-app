/**
 * Internal state interface for the infinite scroll component
 */
export interface IScrollState {
  /** Current page number for page-based pagination */
  currentPage: number;
  /** Next page token for token-based pagination */
  nextPageToken?: string | null;
  /** Whether component is currently loading */
  isLoading: boolean;
  /** Whether there are more items to load */
  hasMoreItems: boolean;
  /** Current error message if any */
  errorMessage?: string | null;
  /** Total number of loaded items */
  totalItems: number;
}
