// Angular
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { EnumMenuPosition } from './models/enums';

// Models
import { IMenuItem } from './models/interfaces';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    DrawerModule
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
})
export class MenuComponent {
  /** Routes to be generated */
  @Input() public routes: IMenuItem[] = [];
  /** Menu Position */
  @Input() public position: EnumMenuPosition = EnumMenuPosition.LEFT;

  /** Check if menu is visible(open) or not */
  public visible: boolean = false;

  /**
   * Controls the visibility of the menu.
   * @param action - Indicates whether to show or hide the menu.
   */
  public setMenuVisibility(action: 'show' | 'hide'): void {
    this.visible = action === 'show';
  }
}
