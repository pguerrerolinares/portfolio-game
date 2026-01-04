import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { DialogueService } from '../../../core/services/dialogue.service';
import { TranslateModule } from '@ngx-translate/core';

/**
 * NPC sprite to emoji mapping for dialogue header
 */
const NPC_ICONS: Record<string, string> = {
  frog: '🐸',
  ladybug: '🐞',
  snail: '🐌',
  mouse: '🐭',
};

@Component({
  selector: 'app-dialogue-box',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  host: {
    '(document:keydown.space)': 'onKeyPressContinue()',
    '(document:keydown.enter)': 'onKeyPressContinue()',
    '(document:keydown.escape)': 'onKeyPressClose()',
  },
  template: `
    @if (dialogue.isOpen()) {
      <div class="dialogue-overlay" (click)="onOverlayClick($event)">
        <div class="dialogue-box" (click)="$event.stopPropagation()">
          <!-- Header with NPC name and icon -->
          <div class="dialogue-header">
            <span class="npc-icon">{{ getNpcIcon() }}</span>
            <span class="npc-name">{{ dialogue.currentNPC()?.name | translate }}</span>
            <button class="close-btn" (click)="onClose()">✕</button>
          </div>

          <!-- Dialogue content -->
          <div class="dialogue-content">
            <p class="dialogue-text">
              {{ dialogue.currentDialogueKey() | translate }}
            </p>
          </div>

          <!-- Footer with page indicator and continue button -->
          <div class="dialogue-footer">
            <span class="page-indicator">
              {{ dialogue.currentPage() + 1 }} / {{ dialogue.totalPages() }}
            </span>
            <button class="continue-btn" (click)="onContinue()">
              @if (dialogue.isLastPage()) {
                @if (dialogue.hasExternalLink()) {
                  {{ 'dialogue.viewMore' | translate }} →
                } @else {
                  {{ 'dialogue.close' | translate }}
                }
              } @else {
                {{ 'dialogue.continue' | translate }} →
              }
            </button>
          </div>

          <!-- Keyboard hint -->
          <div class="keyboard-hint">
            {{ 'dialogue.hint' | translate }}
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .dialogue-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fade-in 0.2s ease-out;
    }

    .dialogue-box {
      background: linear-gradient(180deg, #2a2a4a 0%, #1a1a2e 100%);
      border: 4px solid #ffd700;
      border-radius: 8px;
      width: 90%;
      max-width: 400px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      animation: slide-up 0.3s ease-out;
    }

    .dialogue-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: rgba(255, 215, 0, 0.1);
      border-bottom: 2px solid rgba(255, 215, 0, 0.3);
    }

    .npc-icon {
      font-size: 24px;
    }

    .npc-name {
      flex: 1;
      font-family: 'Press Start 2P', monospace;
      font-size: 12px;
      color: #ffd700;
      text-transform: uppercase;
    }

    .close-btn {
      background: none;
      border: none;
      color: #888;
      font-size: 16px;
      cursor: pointer;
      padding: 4px 8px;
      transition: color 0.2s;
    }

    .close-btn:hover {
      color: #fff;
    }

    .dialogue-content {
      padding: 20px 16px;
      min-height: 80px;
    }

    .dialogue-text {
      font-family: 'VT323', monospace;
      font-size: 18px;
      line-height: 1.5;
      color: #fff;
      margin: 0;
    }

    .dialogue-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-top: 2px solid rgba(255, 215, 0, 0.3);
    }

    .page-indicator {
      font-family: 'Press Start 2P', monospace;
      font-size: 10px;
      color: #888;
    }

    .continue-btn {
      background: #ffd700;
      border: none;
      color: #000;
      font-family: 'Press Start 2P', monospace;
      font-size: 10px;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      transition: transform 0.1s, background 0.2s;
    }

    .continue-btn:hover {
      background: #ffed4a;
      transform: scale(1.05);
    }

    .continue-btn:active {
      transform: scale(0.95);
    }

    .keyboard-hint {
      text-align: center;
      padding: 8px;
      font-family: 'VT323', monospace;
      font-size: 12px;
      color: #666;
    }

    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slide-up {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
})
export class DialogueBoxComponent {
  protected dialogue = inject(DialogueService);

  onKeyPressContinue(): void {
    if (this.dialogue.isOpen()) {
      this.dialogue.next();
    }
  }

  onKeyPressClose(): void {
    if (this.dialogue.isOpen()) {
      this.dialogue.close();
    }
  }

  getNpcIcon(): string {
    const sprite = this.dialogue.currentNPC()?.sprite;
    return sprite ? NPC_ICONS[sprite] || '💬' : '💬';
  }

  onContinue(): void {
    this.dialogue.next();
  }

  onClose(): void {
    this.dialogue.close();
  }

  onOverlayClick(event: Event): void {
    // Close when clicking outside the dialogue box
    this.dialogue.close();
  }
}
