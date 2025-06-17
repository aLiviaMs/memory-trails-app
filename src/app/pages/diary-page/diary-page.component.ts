// Angular
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

// PrimeNg
import { ToggleSwitchChangeEvent, ToggleSwitchModule } from 'primeng/toggleswitch';

// Components
import { RecordCardComponent } from '../../components/record-card/record-card.component';
import { IRecord } from '../../core/services/records/models/interfaces';

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
  imports: [RecordCardComponent, ToggleSwitchModule, FormsModule],
  templateUrl: './diary-page.component.html',
  styleUrl: './diary-page.component.scss',
})
export class DiaryPageComponent {
  /**
   * Controls whether to display only favorite records
   * @type {boolean}
   * @default false
   */
  public showOnlyFavorites: boolean = false;

  /**
   * Array containing filtered records based on the switch state
   * @type {IRecord[]}
   * @default []
   */
  public filteredRecords: IRecord[] = [];

  /**
   * Array containing all available records
   * @type {IRecord[]}
   * @default []
   */
  private readonly _allRecords: IRecord[] = [];

  /**
   * @description Initializes the page data
   */
  public ngOnInit(): void {
    this._updateFilteredRecords();
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
    this._updateFilteredRecords();
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
    const record = this._allRecords.find(
      (record) => record.id === currentRecord.id
    );

    if (record) {
      record.isFavorite = currentRecord.isFavorite;
      this._updateFilteredRecords();
    }
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
      ? this._allRecords.filter((record) => record.isFavorite)
      : [...this._allRecords];
  }
}
