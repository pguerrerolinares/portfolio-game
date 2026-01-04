import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SpriteLoaderService } from '../../core/services/sprite-loader.service';
import { GameLoopService } from '../../core/services/game-loop.service';
import { LoadingScreenComponent } from '../components/loading-screen/loading-screen.component';
import { TransitionOverlayComponent } from '../components/transition-overlay/transition-overlay.component';
import { MenubarComponent } from '../components/menubar/menubar.component';

/**
 * Game layout component.
 * Parent container that handles:
 * - Sprite preloading (once)
 * - Game loop management
 * - Transition overlay
 * - Router outlet for section components
 */
@Component({
  selector: 'app-game-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './game-layout.component.html',
  styleUrl: './game-layout.component.scss',
  imports: [
    RouterOutlet,
    LoadingScreenComponent,
    TransitionOverlayComponent,
    MenubarComponent,
  ],
})
export class GameLayoutComponent implements OnInit {
  private spriteLoader = inject(SpriteLoaderService);
  private gameLoop = inject(GameLoopService);
  private destroyRef = inject(DestroyRef);

  readonly isLoading = this.spriteLoader.isLoading;
  readonly loadProgress = this.spriteLoader.loadProgress;

  async ngOnInit(): Promise<void> {
    // Preload all sprites (only once for entire app)
    await this.spriteLoader.preloadAll();

    // Start game loop
    this.gameLoop.start();

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.gameLoop.stop();
    });
  }
}
