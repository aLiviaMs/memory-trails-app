/* eslint-disable @typescript-eslint/naming-convention */
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
 * Diretiva para implementar scroll infinito em qualquer elemento scrollável
 *
 * @example
 * ```html
 * <div
 *   appInfiniteScroll
 *   [threshold]="200"
 *   [disabled]="loading"
 *   (scrolled)="loadMore()"
 * >
 *   <!-- conteúdo -->
 * </div>
 * ```
 */
@Directive({
  selector: '[appInfiniteScroll]',
  standalone: true
})
export class InfiniteScrollDirective implements OnInit, OnDestroy {
  /** Distância do final para disparar o evento (em pixels) */
  @Input() threshold = 200;

  /** Tempo de debounce para o scroll (em ms) */
  @Input() debounceTime = 100;

  /** Se true, desabilita o infinite scroll */
  @Input() disabled = false;

  /** Se true, não há mais itens para carregar */
  @Input() noMore = false;

  /** Evento emitido quando deve carregar mais itens */
  @Output() scrolled = new EventEmitter<void>();

  /** Evento emitido com a posição do scroll */
  @Output() scrollPosition = new EventEmitter<number>();

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.setupScrollListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Configura o listener de scroll
   */
  private setupScrollListener(): void {
    const element = this.elementRef.nativeElement;

    fromEvent(element, 'scroll')
      .pipe(
        debounceTime(this.debounceTime),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        const scrollPosition = element.scrollTop;
        this.scrollPosition.emit(scrollPosition);

        console.log({scrollPosition})

        if (this.shouldLoadMore(element)) {
          this.scrolled.emit();
        }
      });
  }

  /**
   * Verifica se deve carregar mais itens
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
