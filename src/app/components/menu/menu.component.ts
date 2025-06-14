// Angular
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { EnumMenuPosition } from './models/enums';

// Models
import { IMenuConfig, IMenuItem } from './models/interfaces';

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
  @Input() public config: IMenuConfig = {};
  @Input() public items: IMenuItem[] = [];
  @Input() public position: EnumMenuPosition = EnumMenuPosition.LEFT;

  public visible: boolean = false;

  public toggleMenu(): void {
    this.visible = !this.visible;
  }

  public closeMenu(): void {
    this.visible = false;
  }
}
