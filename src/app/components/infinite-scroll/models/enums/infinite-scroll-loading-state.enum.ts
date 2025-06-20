/**
 * Enumeration for different loading states
 */
export enum EnumScrollState {
  /** Component is idle */
  IDLE = 'idle',
  /** Component is loading initial data */
  LOADING_INITIAL = 'loading-initial',
  /** Component is loading more data */
  LOADING_MORE = 'loading-more',
  /** Component encountered an error */
  ERROR = 'error',
  /** No more data available */
  COMPLETE = 'complete'
}
