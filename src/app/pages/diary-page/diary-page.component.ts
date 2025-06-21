// Angular
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import {
  ToggleSwitchChangeEvent,
  ToggleSwitchModule,
} from 'primeng/toggleswitch';

// PrimeNG Services
import { MessageService } from 'primeng/api';

// RxJS
import { catchError, finalize, of } from 'rxjs';

// Services & Models
import { IRecord } from '../../core/services/records/models/interfaces';
import { RecordsService } from '../../core/services/records/records.service';

// Components
import { RecordCardComponent } from '../../components/record-card/record-card.component';

// Directives
import { InfiniteScrollDirective } from '../../common/directives/infinite-scroll.directive';

/**
 * Componente da página do diário com listagem de records e filtro de favoritos
 */
@Component({
  selector: 'app-diary-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ProgressSpinnerModule,
    MessageModule,
    ToggleSwitchModule,
    ToastModule,
    RecordCardComponent,
    InfiniteScrollDirective,
  ],
  providers: [MessageService],
  templateUrl: './diary-page.component.html',
  styleUrl: './diary-page.component.scss',
})
export class DiaryPageComponent implements OnInit {
  private readonly _recordsService = inject(RecordsService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _messageService = inject(MessageService);

  // Estados
  records = signal<IRecord[]>([]);
  loading = signal(false);
  hasMore = signal(true);
  error = signal<string | null>(null);
  currentPage = signal(0);
  showOnlyFavorites = signal(false);

  readonly pageSize = 5;

  ngOnInit(): void {
    this.loadRecords(true);
  }

  /**
   * Mudança no filtro de favoritos
   */
  onFilterChange(event: ToggleSwitchChangeEvent): void {
    this.showOnlyFavorites.set(event.checked);
    this.resetAndReload();
  }

  /**
   * Carrega mais records quando o scroll chega ao fim
   */
  onScrolled(): void {
    this.loadRecords(false);
  }

  /**
   * Retry quando há erro
   */
  onRetry(): void {
    this.error.set(null);
    this.loadRecords(true);
  }

  /**
   * Manipula o toggle de favorito do card
   */
  onFavoriteToggled(record: IRecord): void {
    // Estado anterior para rollback em caso de erro
    const previousFavoriteState = !record.isFavorite;

    this.updateRecordFavoriteState(record.id, record.isFavorite);

    if (this.showOnlyFavorites() && !record.isFavorite) {
      this.removeRecordFromList(record.id);
    }

    this._recordsService
      .toggleFavorite(record)
      .pipe(
        catchError(() => {
          // Rollback em caso de erro
          this.updateRecordFavoriteState(record.id, previousFavoriteState);

          // Mostrar mensagem de erro
          this._messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail:
              'Não foi possível alterar o status de favorito. Tente novamente.',
            life: 3000,
          });

          return of(null);
        }),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe();
  }

  /**
   * Mostra todos os records (remove filtro de favoritos)
   */
  showAllRecords(): void {
    this.showOnlyFavorites.set(false);
    this.resetAndReload();
  }

  /**
   * Reseta estado e recarrega
   */
  private resetAndReload(): void {
    this.records.set([]);
    this.currentPage.set(0);
    this.hasMore.set(true);
    this.error.set(null);
    this.loadRecords(true);
  }

  /**
   * Carrega records da API
   */
  private loadRecords(isInitial: boolean): void {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);

    this.error.set(null);

    const page = isInitial ? 1 : this.currentPage() + 1;

    // Escolher método baseado no filtro
    const request$ = this.showOnlyFavorites()
      ? this._recordsService.getFavorites({
          page,
          size: this.pageSize,
          sortBy: 'createdAt',
        })
      : this._recordsService.getAll({
          page,
          size: this.pageSize,
          sortBy: 'createdAt',
        });

    request$
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError(() => {
          this.error.set('Erro ao carregar records');

          this._messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Não foi possível carregar os records. Tente novamente.',
            life: 3000,
          });

          return of(null);
        }),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe((response) => {
        if (response?.data) {
          if (isInitial) {
            this.records.set(response.data);
          } else {
            this.records.update((current) => [...current, ...response.data]);
          }

          this.currentPage.set(page);
          this.hasMore.set(response.meta?.limit > response.meta?.page);
        }
      });
  }

  /**
   * Atualiza o estado de favorito de um record específico
   */
  private updateRecordFavoriteState(
    recordId: number,
    isFavorite: boolean
  ): void {
    this.records.update((records) =>
      records.map((record) =>
        record.id === recordId ? { ...record, isFavorite } : record
      )
    );
  }

  /**
   * Remove um record da lista
   */
  private removeRecordFromList(recordId: number): void {
    this.records.update((records) =>
      records.filter((record) => record.id !== recordId)
    );
  }

  /**
   * Getter para template - verifica se está carregando
   */
  get isLoading(): boolean {
    return this.loading();
  }

  /**
   * Cria array de skeletons para loading
   */
  get skeletonArray(): undefined[] {
    return new Array(6).fill(undefined);
  }
}
