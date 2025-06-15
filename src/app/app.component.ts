// Angular
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Components
import { MenuComponent } from './components/menu/menu.component';

// Models
import { EnumMenuPosition } from './components/menu/models/enums';
import { IMenuItem } from './components/menu/models/interfaces';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MenuComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  /** Menu Props */
  public menuRoutes: IMenuItem[] = [
    {
      label: 'Diário',
      route: '/diary',
      icon: 'pi-book',
    },
    {
      label: 'Galeria',
      route: '/gallery',
      icon: 'pi-image',
    },
  ];

  /** Position of the menu */
  public menuPosition: EnumMenuPosition = EnumMenuPosition.LEFT;
}
