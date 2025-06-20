import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { IRecord } from '../../core/services/records/models/interfaces';
import { RecordsService } from '../../core/services/records/records.service';
import { InfiniteScrollComponent } from '../infinite-scroll/infinite-scroll.component';
import {
  EnumPaginationType,
  IPaginationParams,
  IScrollConfig,
  IScrollItem
} from '../infinite-scroll/models';

@Component({
  selector: 'app-records',
  standalone: true,
  imports: [
    CommonModule,
    InfiniteScrollComponent
  ],
  template: `
    <div class="records-container">
      <app-infinite-scroll
        [dataSource]="records"
        [loading]="loading"
        [hasMore]="hasMore"
        [config]="scrollConfig"
        [errorMessage]="errorMessage"
        [additionalParams]="additionalParams"
        [itemTemplate]="recordTemplate"
        (loadMore)="onLoadMore($event)"
        (itemClick)="onItemClick($event)"
        (retry)="onRetry()">
      </app-infinite-scroll>

      <!-- Template para cada item do record -->
      <ng-template #recordTemplate let-record let-index="index">
        <div class="record-item">
          <div class="record-item__header">
            <h3 class="record-item__title">Teste</h3>
            {{record.title}}
          </div>
        </div>
      </ng-template>
    </div>
  `,
  styleUrls: ['./records.component.scss']
})
export class RecordsComponent implements OnInit, OnDestroy {
  records: IScrollItem[] = [];
  loading = false;
  hasMore = true;
  errorMessage: string | null = null;

  readonly scrollConfig: IScrollConfig = {
    itemHeight: 140,
    threshold: 200,
    debounceTime: 150,
    paginationType: EnumPaginationType.PAGE_BASED,
    pageSize: 15
  };

  readonly additionalParams = {
    sortBy: 'datePublished',
    isFavorite: false
  } as const;

  private readonly _destroy$ = new Subject<void>();

  constructor(private readonly _recordsService: RecordsService) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  /**
   * Handles loading more records when scroll reaches threshold
   * @param params - Pagination parameters
   */
  onLoadMore(params: IPaginationParams): void {
    this.loading = true;
    this.errorMessage = null;

    this._recordsService.getAll(params)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (response) => {
          // Ensure we have the correct data structure
          const recordsArray: IRecord[] = Array.isArray(response)
            ? response
            : Array.isArray(response.data)
              ? response.data
              : [];

          // Map IRecord[] to IScrollItem[]
          const newRecords: IScrollItem[] = recordsArray.map((record) => ({
            ...record
            // Add any additional properties required by IScrollItem here
          }));

          this.records = [...this.records, ...newRecords];

          // Update hasMore based on response or if we got fewer items than requested
          this.hasMore = (response.meta?.page === response.meta?.limit);
          this.loading = false;
          console.log({response, loading: this.loading})
        },
        error: (error) => {
          console.error('Error loading records:', error);
          this.errorMessage = 'Erro ao carregar registros. Tente novamente.';
          this.loading = false;
        }
      });
  }

  /**
   * Handles record item click
   * @param item - Clicked record item
   */
  onItemClick(item: IScrollItem): void {
    console.log('Record clicked:', item);
    // TODO: Navigate to detail page or open modal
    // this.router.navigate(['/records', item.id]);
  }

  /**
   * Handles retry action after error
   */
  onRetry(): void {
    this.records = [];
    this.hasMore = true;
    this.loadInitialData();
  }

  /**
   * TrackBy function for performance optimization
   * @param index - Item index
   * @param record - Record item
   * @returns Unique identifier
   */
  trackByRecord(index: number, record: IScrollItem): string | number {
    return record.id;
  }

  /**
   * Gets human-readable status label
   * @param status - Status code
   * @returns Status label
   */
  getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'active': 'Ativo',
      'inactive': 'Inativo',
      'pending': 'Pendente',
      'archived': 'Arquivado'
    };

    return statusMap[status] || status;
  }

  /**
   * Loads initial data
   */
  private loadInitialData(): void {
    this.onLoadMore({
      page: 1,
      size: this.scrollConfig.pageSize,
      ...this.additionalParams
    });
  }
}
