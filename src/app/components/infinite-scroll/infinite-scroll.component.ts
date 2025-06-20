// Angular
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
  computed,
  effect,
  signal
} from '@angular/core';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

// RXJS
import { EMPTY, Subject } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  startWith,
  takeUntil
} from 'rxjs/operators';

// Models
import {
  EnumPaginationType,
  EnumScrollState,
  IPaginationParams,
  IScrollConfig,
  IScrollItem,
  IScrollState
} from './models';

/**
 * Generic infinite scroll component with virtual scrolling support
 * Supports both page-based and token-based pagination
 */
@Component({
  selector: 'app-infinite-scroll',
  standalone: true,
  imports: [
    CommonModule,
    ScrollingModule,
    ProgressSpinnerModule,
    ButtonModule
  ],
  templateUrl: './infinite-scroll.component.html',
  styleUrls: ['./infinite-scroll.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InfiniteScrollComponent implements OnInit, OnDestroy {
  /** Reference to the virtual scroll viewport */
  @ViewChild(CdkVirtualScrollViewport, { static: true })
  viewport!: CdkVirtualScrollViewport;

  /** Template for rendering each item */
  @Input() itemTemplate!: TemplateRef<{ $implicit: IScrollItem; index: number }>;

  /** Array of data items to display */
  @Input() dataSource: IScrollItem[] = [];

  /** Whether the component is currently loading */
  @Input() loading = false;

  /** Whether there are more items to load */
  @Input() hasMore = true;

  /** Configuration for the scroll behavior */
  @Input() config: IScrollConfig = {
    itemHeight: 80,
    threshold: 200,
    debounceTime: 100,
    paginationType: EnumPaginationType.PAGE_BASED,
    pageSize: 20
  };

  /** Error message to display */
  @Input() errorMessage: string | null = null;

  /** Additional pagination parameters */
  @Input() additionalParams: Record<string, unknown> = {};

  /** Event emitted when more data needs to be loaded */
  @Output() loadMore = new EventEmitter<IPaginationParams>();

  /** Event emitted when an item is clicked */
  @Output() itemClick = new EventEmitter<IScrollItem>();

  /** Event emitted when retry is requested */
  @Output() retry = new EventEmitter<void>();

  /** Event emitted when scroll position changes */
  @Output() scrollPositionChange = new EventEmitter<number>();

  /** Subject for component destruction */
  private readonly _destroy$ = new Subject<void>();

  /** Internal state management */
  private readonly _state = signal<IScrollState>({
    currentPage: 0,
    nextPageToken: null,
    isLoading: false,
    hasMoreItems: true,
    errorMessage: null,
    totalItems: 0
  });

  /** Computed current scroll state */
  readonly currentState = computed(() => {
    const state = this._state();
    if (state.errorMessage) return EnumScrollState.ERROR;
    if (state.isLoading && state.totalItems === 0) return EnumScrollState.LOADING_INITIAL;
    if (state.isLoading) return EnumScrollState.LOADING_MORE;
    if (!state.hasMoreItems) return EnumScrollState.COMPLETE;
    return EnumScrollState.IDLE;
  });

  /** Single consolidated loading state - handles ALL loading scenarios */
  get isLoading(): boolean {
    const state = this.currentState();
    return state === EnumScrollState.LOADING_INITIAL || state === EnumScrollState.LOADING_MORE;
  };

  /** Computed error state for template */
  get hasError(): boolean {
    return this.currentState() === EnumScrollState.ERROR
  }

  constructor(private readonly cdr: ChangeDetectorRef) {
    // Effect to sync external loading state with internal state
    effect(() => {
      this._state.update(state => ({
        ...state,
        isLoading: this.loading,
        hasMoreItems: this.hasMore,
        errorMessage: this.errorMessage,
        totalItems: this.dataSource.length
      }));
    });
  }

  /**
   * Component initialization
   */
  ngOnInit(): void {
    this.setupScrollListener();
    this.initializeState();
  }

  /**
   * Component cleanup
   */
  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  /**
   * Handles item click events
   * @param item - The clicked item
   */
  onItemClick(item: IScrollItem): void {
    this.itemClick.emit(item);
  }

  /**
   * Handles retry button click
   */
  onRetry(): void {
    this._state.update(state => ({
      ...state,
      errorMessage: null
    }));
    this.retry.emit();
  }

  /**
   * Manually triggers loading more data
   */
  loadMoreData(): void {
    if (this.canLoadMore()) {
      this.triggerLoadMore();
    }
  }

  /**
   * Scrolls to a specific item by index
   * @param index - Index of the item to scroll to
   */
  scrollToIndex(index: number): void {
    if (this.viewport && index >= 0 && index < this.dataSource.length) {
      this.viewport.scrollToIndex(index);
    }
  }

  /**
   * Scrolls to the top of the list
   */
  scrollToTop(): void {
    if (this.viewport) {
      this.viewport.scrollToIndex(0);
    }
  }

  /**
   * Sets up the scroll event listener with debouncing
   */
  private setupScrollListener(): void {
    if (!this.viewport) return;

    const scroll$ = this.viewport.elementScrolled().pipe(
      startWith(null),
      debounceTime(this.config.debounceTime ?? 100),
      map(() => this.viewport.measureScrollOffset()),
      distinctUntilChanged(),
      takeUntil(this._destroy$)
    );

    const scrollEnd$ = scroll$.pipe(
      filter(() => this.shouldLoadMore()),
      catchError(() => EMPTY)
    );

    // Emit scroll position changes
    scroll$.subscribe(position => {
      this.scrollPositionChange.emit(position);
    });

    // Handle load more trigger
    scrollEnd$.subscribe(() => {
      this.triggerLoadMore();
    });
  }

  /**
   * Initializes the component state
   */
  private initializeState(): void {
    this._state.set({
      currentPage: 0,
      nextPageToken: null,
      isLoading: this.loading,
      hasMoreItems: this.hasMore,
      errorMessage: this.errorMessage,
      totalItems: this.dataSource.length
    });
  }

  /**
   * Determines if more data should be loaded based on scroll position
   * @returns True if more data should be loaded
   */
  private shouldLoadMore(): boolean {
    if (!this.viewport || !this.canLoadMore()) {
      return false;
    }

    const threshold = this.config.threshold ?? 200;
    const scrollOffset = this.viewport.measureScrollOffset();
    const scrollHeight = this.viewport.getDataLength() * this.config.itemHeight;
    const viewportHeight = this.viewport.getViewportSize();

    return (scrollHeight - scrollOffset - viewportHeight) <= threshold;
  }

  /**
   * Checks if more data can be loaded
   * @returns True if more data can be loaded
   */
  private canLoadMore(): boolean {
    const state = this._state();
    return state.hasMoreItems &&
           !state.isLoading &&
           !state.errorMessage &&
           this.dataSource.length > 0;
  }

  /**
   * Triggers the load more event with appropriate parameters
   */
  private triggerLoadMore(): void {
    const state = this._state();
    const params = this.buildPaginationParams(state);

    this._state.update(currentState => ({
      ...currentState,
      isLoading: true
    }));

    this.loadMore.emit(params);
  }

  /**
   * Builds pagination parameters based on the pagination type
   * @param state - Current component state
   * @returns Pagination parameters
   */
  private buildPaginationParams(state: IScrollState): IPaginationParams {
    const baseParams: IPaginationParams = {
      ...this.additionalParams
    };

    switch (this.config.paginationType) {
      case EnumPaginationType.PAGE_BASED:
        return {
          ...baseParams,
          page: state.currentPage + 1,
          size: this.config.pageSize ?? 20
        };

      case EnumPaginationType.TOKEN_BASED:
        return {
          ...baseParams,
          pageToken: state.nextPageToken ?? '',
          pageSize: String(this.config.pageSize ?? 20)
        };

      default:
        return baseParams;
    }
  }

  /**
   * Updates the pagination state after successful data load
   * @param nextPageToken - Next page token for token-based pagination
   */
  updatePaginationState(nextPageToken?: string): void {
    this._state.update(state => ({
      ...state,
      currentPage: this.config.paginationType === EnumPaginationType.PAGE_BASED
        ? state.currentPage + 1
        : state.currentPage,
      nextPageToken: nextPageToken ?? null,
      isLoading: false
    }));
  }

  /**
   * Resets the component state for new data loading
   */
  reset(): void {
    this._state.set({
      currentPage: 0,
      nextPageToken: null,
      isLoading: false,
      hasMoreItems: true,
      errorMessage: null,
      totalItems: 0
    });
    this.scrollToTop();
  }
}
