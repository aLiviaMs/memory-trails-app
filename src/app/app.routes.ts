import { Routes } from '@angular/router';
import { DiaryPageComponent } from './pages/diary-page/diary-page.component';
import { GalleryPageComponent } from './pages/gallery-page/gallery-page.component';

export const routes: Routes = [
  { path: '', redirectTo: '/diary', pathMatch: 'full' },
  { path: 'diary', component: DiaryPageComponent },
  { path: 'gallery', component: GalleryPageComponent },
  { path: '**', redirectTo: '/diary' }
];
