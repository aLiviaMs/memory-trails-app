// Angular
import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject
} from '@angular/core';

// RxJS
import { Subject, debounceTime, distinctUntilChanged, fromEvent, takeUntil } from 'rxjs';

/**
 * Directive to implement infinite scrolling on any scrollable element.
 *
 * @example
 * ```html
 * <div
 *   appInfiniteScroll
 *   [threshold]="200"
 *   [disabled]="loading"
 *   (scrolled)="loadMore()"
 * >
 *   <!-- content -->
 * </div>
 * ```
 */
@Directive({
  selector: '[appInfiniteScroll]',
  standalone: true
})
export class InfiniteScrollDirective implements OnInit, OnDestroy {
  /** Distance from the bottom of the scroll (in pixels) to trigger the load event */
  @Input() threshold = 200;

  /** Debounce time for scroll events (in milliseconds) */
  @Input() debounceTime = 100;

  /** If true, infinite scroll is disabled */
  @Input() disabled = false;

  /** If true, indicates there are no more items to load */
  @Input() noMore = false;

  /** Event emitted when more items should be loaded */
  @Output() scrolled = new EventEmitter<void>();

  /** Event emitted with the current scroll position */
  @Output() scrollPosition = new EventEmitter<number>();

  private readonly _elementRef = inject(ElementRef<HTMLElement>);
  private readonly _destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.setupScrollListener();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  /**
   * Sets up the scroll event listener with debounce and change detection.
   */
  private setupScrollListener(): void {
    const element = this._elementRef.nativeElement;

    fromEvent(element, 'scroll')
      .pipe(
        debounceTime(this.debounceTime),
        distinctUntilChanged(),
        takeUntil(this._destroy$)
      )
      .subscribe(() => {
        const scrollPosition = element.scrollTop;
        this.scrollPosition.emit(scrollPosition);

        if (this.shouldLoadMore(element)) {
          this.scrolled.emit();
        }
      });
  }

  /**
   * Determines whether more items should be loaded based on scroll position.
   */
  private shouldLoadMore(element: HTMLElement): boolean {
    if (this.disabled || this.noMore) {
      return false;
    }

    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;

    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    return distanceFromBottom <= this.threshold;
  }
}
