/**
 * Generic interface for scroll items
 */
export interface IScrollItem {
  /** Unique identifier for the item */
  id: string | number;
  /** Additional properties based on the data type */
  [key: string]: unknown;
}
