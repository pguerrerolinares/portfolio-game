import {
  Component,
  inject,
  input,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NPC } from '../../../core/models/world.model';
import { DialogueService } from '../../../core/services/dialogue.service';

/**
 * NPC Interact Button Component
 *
 * Small circular button that appears in the center of the joystick
 * when the player is near an NPC. Tapping it opens the dialogue.
 */
@Component({
  selector: 'app-npc-interact-button',
  templateUrl: './npc-interact-button.component.html',
  styleUrl: './npc-interact-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NpcInteractButtonComponent {
  private document = inject(DOCUMENT);
  private dialogueService = inject(DialogueService);

  // Base path for assets (handles GitHub Pages base-href)
  readonly basePath = this.document.baseURI.replace(/\/$/, '');

  readonly npc = input.required<NPC>();
  readonly isPressed = signal(false);

  onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.isPressed.set(true);
    this.dialogueService.open(this.npc());
  }

  onTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.isPressed.set(false);
  }
}
