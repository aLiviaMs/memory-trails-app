/**
 * Pagination parameters interface supporting different pagination strategies
 */
export interface IPaginationParams {
  // Page-based pagination (Records API)
  /** Current page number (0-based) */
  page?: number;
  /** Number of items per page */
  size?: number;
  /** Sort field */
  sortBy?: string;
  /** Filter for favorite items */
  isFavorite?: boolean;

  // Token-based pagination (Drive API)
  /** Next page token */
  pageToken?: string;
  /** Page size as string */
  pageSize?: string;
  /** Order by field */
  orderBy?: string;
  /** Folder ID for Drive API */
  folderId?: string;

  /** Additional dynamic parameters */
  [key: string]: unknown;
}
