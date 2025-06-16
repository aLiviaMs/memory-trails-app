// Angular
import { Component, EventEmitter, Input, Output } from '@angular/core';

// PrimeNg
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';

// Models
import { IRecord } from '../../core/services/records/models/interfaces';

/**
 * A reusable card component for displaying record information with favorite functionality.
 *
 * This component renders a card with record details and provides the ability to toggle
 * the favorite status. When no content is provided, it displays a skeleton loader.
 *
 * @example
 * ```html
 * <app-record-card
 *   [content]="recordData"
 *   (favoriteToggled)="onFavoriteChanged($event)">
 * </app-record-card>
 * ```
 */
@Component({
  selector: 'app-record-card',
  standalone: true,
  imports: [CardModule, ButtonModule, SkeletonModule],
  templateUrl: './record-card.component.html',
  styleUrl: './record-card.component.scss',
})
export class RecordCardComponent {
  /**
   * The record data to be displayed in the card.
   * When undefined, the component will show a skeleton loader instead.
   */
  @Input() public content?: IRecord;

  /**
   * Event emitted when the favorite status is toggled.
   * Emits the new favorite state (true/false).
   */
  @Output() public favoriteToggled: EventEmitter<boolean> = new EventEmitter<boolean>();

  /**
   * Gets the current favorite status of the record.
   *
   * @returns True if the record is marked as favorite, false otherwise.
   */
  public get isFavorite(): boolean {
    return !!this.content?.isFavorite;
  }

  /**
   * Sets the favorite status of the current record.
   * Only updates if content is available.
   *
   * @param value - The new favorite status to set.
   */
  private set _isFavorite(value: boolean) {
    if (this.content) {
      this.content.isFavorite = value;
    }
  }

  /**
   * Gets the appropriate icon class for the favorite button based on current state.
   *
   * @returns The PrimeNG icon class - filled heart for favorite, outline heart for not favorite.
   */
  public get favoriteIcon(): string {
    return this.isFavorite ? 'pi pi-heart-fill' : 'pi pi-heart';
  }

  /**
   * Formats the record's published date for display.
   *
   * @returns The formatted date string in Brazilian Portuguese format (dd/mm/yyyy),
   *          or an empty string if no date is available.
   */
  public get datePublished(): string {
    const { datePublished } = this.content || {};

    if (!datePublished) return '';

    const date = new Date(datePublished);
    return date.toLocaleDateString('pt-BR');
  }

  /**
   * Toggles the favorite status of the record and emits the change event.
   *
   * This method updates the internal favorite state and notifies parent components
   * of the change through the favoriteToggled event emitter.
   */
  public toggleFavorite(): void {
    this._isFavorite = !this.isFavorite;
    this.favoriteToggled.emit(this.isFavorite);
  }
}
