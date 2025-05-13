import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'gallery',
        loadComponent: () =>
          import('../pages/gallery/gallery.page').then((m) => m.GalleryPage),
      },
      {
        path: 'diary',
        loadComponent: () =>
           import('../pages/diary/diary.page').then((m) => m.DiaryPage),
      },
      {
        path: '',
        redirectTo: '/tabs/gallery',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/gallery',
    pathMatch: 'full',
  },
];
