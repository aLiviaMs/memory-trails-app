// Angular
import { Component, EventEmitter, Input, Output } from '@angular/core';

// PrimeNg
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';

// Models
import { IRecord } from '../../core/services/records/models/interfaces';

@Component({
  selector: 'app-record-card',
  standalone: true,
  imports: [CardModule, ButtonModule, SkeletonModule],
  templateUrl: './record-card.component.html',
  styleUrl: './record-card.component.scss',
})
export class RecordCardComponent {
  @Input() public content?: IRecord;
  @Output() public favoriteToggled: EventEmitter<boolean> = new EventEmitter<boolean>();

  public get isFavorite(): boolean {
    return !!this.content?.isFavorite;
  }

  private set _isFavorite(value: boolean) {
    if (this.content) {
      this.content.isFavorite = value;
    }
  }

  public get favoriteIcon(): string {
    return this.isFavorite ? 'pi pi-heart-fill' : 'pi pi-heart';
  }

  public get datePublished(): string {
    const { datePublished } = this.content || {};

    if (!datePublished) return '';

    const date = new Date(datePublished);
    return date.toLocaleDateString('pt-BR');
  }

  public toggleFavorite(): void {
    this._isFavorite = !this.isFavorite;
    this.favoriteToggled.emit(this.isFavorite);
  }
}
