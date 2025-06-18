// Angular
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, EMPTY, finalize, Subject, takeUntil } from 'rxjs';

// PrimeNg
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import {
  ToggleSwitchChangeEvent,
  ToggleSwitchModule,
} from 'primeng/toggleswitch';

// Components
import { RecordCardComponent } from '../../components/record-card/record-card.component';
import {
  IRecord,
  IRecordPaginationParams,
} from '../../core/services/records/models/interfaces';
import { RecordsService } from '../../core/services/records/records.service';

/**
 * Component responsible for displaying a records listing page
 * with favorite filtering functionality
 *
 * @component RecordsPageComponent
 * @description This component manages the display of a records list,
 * allowing users to filter only records marked as favorites
 * through a toggle switch.
 *
 * @example
 * ```html
 * <app-records-page></app-records-page>
 * ```
 */
@Component({
  selector: 'app-diary-page',
  imports: [
    RecordCardComponent,
    ToggleSwitchModule,
    FormsModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './diary-page.component.html',
  styleUrl: './diary-page.component.scss',
})
export class DiaryPageComponent implements OnInit, OnDestroy {
  /**
   * Controls whether to display only favorite records
   * @type {boolean}
   * @default false
   */
  public showOnlyFavorites: boolean = false;

  /**
   * Array containing all loaded records
   */
  public allRecords: IRecord[] = [];

  /**
   * Array containing filtered records based on the switch state
   * @type {IRecord[]}
   * @default []
   */
  public filteredRecords: IRecord[] = [];

  /**
   * Loading state for initial load and pagination
   */
  public isLoading: boolean = false;

  /**
   * Indicates if there are more records to load
   */
  public hasMoreRecords: boolean = true;

  /**
   * Current pagination parameters
   */
  private readonly _paginationParams: IRecordPaginationParams = {
    page: 1,
    size: 10,
    sortBy: 'datePublished', // ou outro campo de ordenação
  };

  /**
   * Subject for handling component destruction
   */
  private readonly _destroy$ = new Subject<void>();

  constructor(private readonly _recordService: RecordsService) {}

  /**
   * Initializes the component and loads initial data
   */
  public ngOnInit(): void {
    this._loadInitialRecords();
  }

  /**
   * Cleanup subscriptions on component destruction
   */
  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  /**
   * Listens for scroll events to trigger infinite scroll
   */
  @HostListener('window:scroll', ['$event'])
  public onScroll(): void {
    if (this._shouldLoadMore()) {
      this._loadMoreRecords();
    }
  }

  /**
   * Handles the filter switch state change
   *
   * @description This method is called when the user changes the state
   * of the "Show only favorites" switch. Updates the internal property
   * and re-filters the records list.
   *
   * @param {any} event - Event emitted by PrimeNG's InputSwitch component
   * @param {boolean} event.checked - Current switch state (true/false)
   * @returns {void}
   */
  public onFilterChange(event: ToggleSwitchChangeEvent): void {
    this.showOnlyFavorites = event.checked;
    this._resetAndReload();
  }

  /**
   * Handles when a record has its favorite status changed
   *
   * @description This method is executed when a record card
   * emits the favorite toggle event. Updates the corresponding record
   * in the main list and re-filters the results.
   *
   * @param {FavoriteToggleEvent} event - Favorite toggle event data
   * @param {string} event.recordId - ID of the changed record
   * @param {boolean} event.isFavorite - New favorite status
   */
  public onFavoriteChanged(currentRecord: IRecord): void {
    const record = this.allRecords.find(
      (record) => record.id === currentRecord.id
    );

    if (record) {
      // Atualiza localmente primeiro para UX responsiva
      record.isFavorite = currentRecord.isFavorite;
      this._updateFilteredRecords();

      // Faz o update no backend
      this._updateFavoriteInBackend(currentRecord);
    }
  }

  /**
   * Updates the favorite status in the backend
   */
  private _updateFavoriteInBackend(record: IRecord): void {
    const { id: recordId, ...recordData } = record;

    this._recordService
      .partialUpdate(recordId, recordData)
      .pipe(
        takeUntil(this._destroy$),
        catchError(() => {
          // Revert if something go wrong
          const localRecord = this.allRecords.find((r) => r.id === record.id);
          if (localRecord) {
            localRecord.isFavorite = !record.isFavorite; // Reverte
            this._updateFilteredRecords();
          }

          // TODO: add some kinda of feedback to user

          return EMPTY;
        })
      )
      .subscribe();
  }

  /**
   * Loads initial records
   */
  private _loadInitialRecords(): void {
    this.isLoading = true;
    this._paginationParams.page = 1;
    this.allRecords = [];
    this.hasMoreRecords = true;

    this._fetchRecords()
      .pipe(
        takeUntil(this._destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (response) => {
          this.allRecords = response.data || [];
          this._updateFilteredRecords();
          this._checkIfHasMoreRecords(response.data?.length || 0);
        },
        error: () => {
          this.allRecords = [];
          this._updateFilteredRecords();
        },
      });
  }

  /**
   * Loads more records for infinite scroll
   */
  /**
   * Loads more records for infinite scroll
   */
  private _loadMoreRecords(): void {
    if (this.isLoading || !this.hasMoreRecords) {
      return;
    }

    this.isLoading = true;
    this._paginationParams.page++;

    this._fetchRecords()
      .pipe(
        takeUntil(this._destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (response) => {
          const newRecords = response.data || [];

          const uniqueNewRecords = this._removeDuplicates(newRecords);

          this.allRecords = [...this.allRecords, ...uniqueNewRecords];
          this._updateFilteredRecords();
          this._checkIfHasMoreRecords(newRecords.length);
        },
        error: (error) => {
          console.error('Erro ao carregar mais registros:', error);
          this._paginationParams.page--;
        },
      });
  }

  /**
   * Remove duplicatas baseado no ID
   */
  private _removeDuplicates(newRecords: IRecord[]): IRecord[] {
    const existingIds = new Set(this.allRecords.map((record) => record.id));
    return newRecords.filter((record) => !existingIds.has(record.id));
  }

  /**
   * Fetches records based on current filter state
   */
  private _fetchRecords() {
    if (this.showOnlyFavorites) {
      return this._recordService.getFavoriteRecords(this._paginationParams);
    } else {
      return this._recordService.getRecordsWithPagination(
        this._paginationParams
      );
    }
  }

  /**
   * Resets pagination and reloads data when filter changes
   */
  private _resetAndReload(): void {
    this._paginationParams.page = 1;
    this.allRecords = [];
    this.hasMoreRecords = true;
    this._loadInitialRecords();
  }

  /**
   * Updates the filtered records list based on the current filter state
   *
   * @description Private method that recalculates the `filteredRecords` list
   * based on the `showOnlyFavorites` value. If the filter is active,
   * shows only favorite records; otherwise, shows all records.
   *
   * @returns {void}
   */
  private _updateFilteredRecords(): void {
    this.filteredRecords = this.showOnlyFavorites
      ? this.allRecords.filter((record) => record.isFavorite)
      : [...this.allRecords];
  }

  /**
   * Checks if there are more records to load
   */
  private _checkIfHasMoreRecords(loadedCount: number): void {
    this.hasMoreRecords = loadedCount === this._paginationParams.size;
  }

  /**
   * Determines if more records should be loaded based on scroll position
   */
  private _shouldLoadMore(): boolean {
    if (this.isLoading || !this.hasMoreRecords) {
      return false;
    }

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // Trigger when user is 200px from bottom
    const threshold = 200;

    return scrollTop + windowHeight >= documentHeight - threshold;
  }
}
