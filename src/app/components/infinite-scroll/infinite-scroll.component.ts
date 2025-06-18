import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  TrackByFunction,
} from '@angular/core';
import { LazyLoadEvent } from 'primeng/api';
import { Subject } from 'rxjs';
import {
  DEFAULT_INFINITE_SCROLL_CONFIG,
  IInfiniteScrollConfig,
  IInfiniteScrollEvent,
  IInfiniteScrollState,
} from './models/interfaces';

/**
 * Template context for each rendered item
 */
interface IItemTemplateContext<T> {
  $implicit: T;
  index: number;
  isLast: boolean;
}

/**
 * Template context for skeleton loader
 */
interface ISkeletonTemplateContext {
  itemSize: number;
}

/**
 * Reusable infinite scroll component using PrimeNG
 * Compatible with Angular v19+ using the new control flow syntax.
 *
 * @example
 * ```html
 * <app-infinite-scroll
 *   [items]="products"
 *   [config]="scrollConfig"
 *   [totalRecords]="totalRecords"
 *   (onLoadMore)="loadMoreProducts($event)">
 *
 *   <ng-template #itemTemplate let-product let-index="index">
 *     <div class="product-card">
 *       <h3>{{ product.name }}</h3>
 *       <p>{{ product.description }}</p>
 *     </div>
 *   </ng-template>
 * </app-infinite-scroll>
 * ```
 */
@Component({
  selector: 'app-infinite-scroll',
  templateUrl: './infinite-scroll.component.html',
  styleUrls: ['./infinite-scroll.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfiniteScrollComponent<T = unknown>
  implements OnInit, OnChanges, OnDestroy
{
  /** List of items to be rendered */
  @Input() items: T[] = [];

  /** Infinite scroll configuration options */
  @Input() config: Partial<IInfiniteScrollConfig> = {};

  /** Total number of available records in the data source */
  @Input() totalRecords = 0;

  /** Whether data is currently loading */
  @Input() loading = false;

  /** Optional custom trackBy function for ngFor */
  @Input() trackBy?: TrackByFunction<T>;

  /** Event emitted when more data needs to be loaded */
  @Output() onLoadMore = new EventEmitter<IInfiniteScrollEvent>();

  /** Template for rendering each item */
  @ContentChild('itemTemplate') itemTemplate?: TemplateRef<
    IItemTemplateContext<T>
  >;

  /** Optional skeleton loader template */
  @ContentChild('skeletonTemplate')
  skeletonTemplate?: TemplateRef<ISkeletonTemplateContext>;

  /** Optional custom loading template */
  @ContentChild('loadingTemplate') loadingTemplate?: TemplateRef<void>;

  /** Optional empty state template */
  @ContentChild('emptyTemplate') emptyTemplate?: TemplateRef<void>;

  /** Optional end-of-list template */
  @ContentChild('endTemplate') endTemplate?: TemplateRef<void>;

  /** Merged configuration including defaults */
  public config$: Required<IInfiniteScrollConfig>;

  /** Current scroll state (loading, pagination, etc.) */
  public state: IInfiniteScrollState = {
    loading: false,
    totalRecords: 0,
    hasMore: true,
    currentPage: 1,
  };

  /** Internal destroy Subject for cleaning up subscriptions */
  private readonly _destroy$ = new Subject<void>();

  constructor() {
    this.config$ = { ...DEFAULT_INFINITE_SCROLL_CONFIG };
  }

  /** Initializes the component and merges config */
  ngOnInit(): void {
    this._mergeConfig();
    this._updateState();
  }

  /** Handles changes to input properties */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config']) {
      this._mergeConfig();
    }

    if (changes['items'] || changes['totalRecords'] || changes['loading']) {
      this._updateState();
    }
  }

  /** Cleans up resources when component is destroyed */
  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  /**
   * Default or custom trackBy function
   * Supports Angular v19 @for syntax
   */
  public _trackByFn: TrackByFunction<T> = (index: number, item: T): unknown => {
    return this.trackBy ? this.trackBy(index, item) : index;
  };

  /** Handles PrimeNG lazy load event */
  public _onLazyLoad(event: LazyLoadEvent): void {
    if (this.state.loading || !this.state.hasMore) {
      return;
    }

    const scrollEvent: IInfiniteScrollEvent = {
      first: event.first as number,
      rows: event.rows ?? this.config$.pageSize,
      page:
        Math.floor(
          (event.first as number) / (event.rows ?? this.config$.pageSize)
        ) + 1,
    };

    this._updateLoadingState(true);
    this.onLoadMore.emit(scrollEvent);
  }

  /** Resets the internal scroll state (e.g. on filter reset) */
  public reset(): void {
    this.state.currentPage = 1;
    this.state.hasMore = true;
    this.state.loading = false;
  }

  /** Updates the scroll configuration at runtime */
  public updateConfig(newConfig: Partial<IInfiniteScrollConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this._mergeConfig();
  }

  /** Returns template context for a given item */
  public _getItemContext(item: T, index: number): IItemTemplateContext<T> {
    return {
      $implicit: item,
      index,
      isLast: index === this.items.length - 1,
    };
  }

  /** Returns template context for skeleton loader */
  public _getSkeletonContext(itemSize: number): ISkeletonTemplateContext {
    return { itemSize };
  }

  /** Merges user-defined config with default values */
  private _mergeConfig(): void {
    this.config$ = { ...DEFAULT_INFINITE_SCROLL_CONFIG, ...this.config };
  }

  /** Updates internal scroll state based on inputs */
  private _updateState(): void {
    this.state.loading = this.loading;
    this.state.totalRecords = this.totalRecords;
    this.state.hasMore =
      this.totalRecords === 0 || this.items.length < this.totalRecords;
    this.state.currentPage =
      Math.ceil(this.items.length / this.config$.pageSize) || 1;
  }

  /** Updates loading flag in the scroll state */
  private _updateLoadingState(loading: boolean): void {
    this.state.loading = loading;
  }

  /** Checks whether the item template is defined */
  private _hasItemTemplate(): boolean {
    return !!this.itemTemplate;
  }

  /** Determines whether more data can be loaded */
  private _canLoadMore(): boolean {
    return !this.state.loading && this.state.hasMore;
  }
}
