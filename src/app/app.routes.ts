import { Routes } from '@angular/router';
import { GameLayoutComponent } from './game/layout/game-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: GameLayoutComponent,
    children: [
      {
        // Tower world - single route for Jump King style gameplay
        path: '',
        loadComponent: () =>
          import('./game/tower-world/tower-world.component').then(
            (m) => m.TowerWorldComponent
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
