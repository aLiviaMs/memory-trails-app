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
  TrackByFunction
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
 * Context para template de item
 */
interface IItemTemplateContext<T> {
  $implicit: T;
  index: number;
  isLast: boolean;
}

/**
 * Context para template de skeleton
 */
interface ISkeletonTemplateContext {
  itemSize: number;
}

/**
 * Componente reutilizável de infinite scroll com PrimeNG
 * Compatível com Angular v19 usando nova sintaxe de control flow
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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InfiniteScrollComponent<T = unknown> implements OnInit, OnChanges, OnDestroy {
  /**
   * Array de itens a serem exibidos
   */
  @Input() items: T[] = [];

  /**
   * Configurações do infinite scroll
   */
  @Input() config: Partial<IInfiniteScrollConfig> = {};

  /**
   * Total de registros disponíveis na fonte de dados
   */
  @Input() totalRecords = 0;

  /**
   * Indica se está carregando dados
   */
  @Input() loading = false;

  /**
   * Função de track by customizada para performance
   */
  @Input() trackBy?: TrackByFunction<T>;

  /**
   * Evento emitido quando mais dados precisam ser carregados
   */
  @Output() onLoadMore = new EventEmitter<IInfiniteScrollEvent>();

  /**
   * Template para renderizar cada item
   */
  @ContentChild('itemTemplate') itemTemplate?: TemplateRef<IItemTemplateContext<T>>;

  /**
   * Template customizado para skeleton loading
   */
  @ContentChild('skeletonTemplate') skeletonTemplate?: TemplateRef<ISkeletonTemplateContext>;

  /**
   * Template customizado para estado de carregamento
   */
  @ContentChild('loadingTemplate') loadingTemplate?: TemplateRef<void>;

  /**
   * Template customizado para estado vazio
   */
  @ContentChild('emptyTemplate') emptyTemplate?: TemplateRef<void>;

  /**
   * Template customizado para fim dos dados
   */
  @ContentChild('endTemplate') endTemplate?: TemplateRef<void>;

  /** Configuração mesclada com valores padrão */
  public config$: Required<IInfiniteScrollConfig>;

  /** Estado atual do infinite scroll */
  public state: IInfiniteScrollState = {
    loading: false,
    totalRecords: 0,
    hasMore: true,
    currentPage: 1
  };

  /** Subject para cleanup de subscriptions */
  private readonly _destroy$ = new Subject<void>();

  constructor() {
    this.config$ = { ...DEFAULT_INFINITE_SCROLL_CONFIG };
  }

  /**
   * Inicializa o componente e mescla configurações
   */
  ngOnInit(): void {
    this._mergeConfig();
    this._updateState();
  }

  /**
   * Detecta mudanças nos inputs e atualiza estado
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config']) {
      this._mergeConfig();
    }

    if (changes['items'] || changes['totalRecords'] || changes['loading']) {
      this._updateState();
    }
  }

  /**
   * Cleanup ao destruir o componente
   */
  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  /**
   * Função de track by padrão ou customizada
   * Compatível com nova sintaxe @for do Angular v19
   */
  public _trackByFn: TrackByFunction<T> = (index: number, item: T): unknown => {
    return this.trackBy ? this.trackBy(index, item) : index;
  };

  /**
   * Handler para evento de lazy load do PrimeNG Scroller
   */
  public _onLazyLoad(event: LazyLoadEvent): void {
    if (this.state.loading || !this.state.hasMore) {
      return;
    }

    const scrollEvent: IInfiniteScrollEvent = {
      first: event.first as number,
      rows: event.rows ?? this.config$.pageSize,
      page: Math.floor((event.first as number) / (event.rows ?? this.config$.pageSize)) + 1
    };

    this._updateLoadingState(true);
    this.onLoadMore.emit(scrollEvent);
  }

  /**
   * Reseta o estado do infinite scroll
   * Útil para quando os dados são filtrados ou resetados
   */
  public reset(): void {
    this.state.currentPage = 1;
    this.state.hasMore = true;
    this.state.loading = false;
  }

  /**
   * Atualiza configurações do infinite scroll
   */
  public updateConfig(newConfig: Partial<IInfiniteScrollConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this._mergeConfig();
  }

  /**
   * Obtém contexto para template de item
   */
  public _getItemContext(item: T, index: number): IItemTemplateContext<T> {
    return {
      $implicit: item,
      index,
      isLast: index === this.items.length - 1
    };
  }

  /**
   * Obtém contexto para template de skeleton
   */
  public _getSkeletonContext(itemSize: number): ISkeletonTemplateContext {
    return { itemSize };
  }

  /**
   * Mescla configuração do usuário com padrões
   */
  private _mergeConfig(): void {
    this.config$ = { ...DEFAULT_INFINITE_SCROLL_CONFIG, ...this.config };
  }

  /**
   * Atualiza estado interno baseado nas props
   */
  private _updateState(): void {
    this.state.loading = this.loading;
    this.state.totalRecords = this.totalRecords;
    this.state.hasMore = this.totalRecords === 0 || this.items.length < this.totalRecords;
    this.state.currentPage = Math.ceil(this.items.length / this.config$.pageSize) || 1;
  }

  /**
   * Atualiza estado de carregamento
   */
  private _updateLoadingState(loading: boolean): void {
    this.state.loading = loading;
  }

  /**
   * Valida se há template de item definido
   */
  private _hasItemTemplate(): boolean {
    return !!this.itemTemplate;
  }

  /**
   * Valida se há mais dados para carregar
   */
  private _canLoadMore(): boolean {
    return !this.state.loading && this.state.hasMore;
  }
}
