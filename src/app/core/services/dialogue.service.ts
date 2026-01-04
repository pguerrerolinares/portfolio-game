import { Injectable, signal, computed } from '@angular/core';
import { NPC } from '../models/world.model';

/**
 * Service for managing NPC dialogues
 * Handles multi-page dialogues with navigation
 */
@Injectable({ providedIn: 'root' })
export class DialogueService {
  // Current NPC being talked to
  private readonly _currentNPC = signal<NPC | null>(null);

  // Current page index (0-based)
  private readonly _currentPage = signal(0);

  // Public signals
  readonly currentNPC = this._currentNPC.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();

  // Whether dialogue is open
  readonly isOpen = computed(() => this._currentNPC() !== null);

  // Total pages for current dialogue
  readonly totalPages = computed(() => {
    const npc = this._currentNPC();
    return npc ? npc.dialogue.length : 0;
  });

  // Current dialogue text key (i18n key)
  readonly currentDialogueKey = computed(() => {
    const npc = this._currentNPC();
    const page = this._currentPage();
    return npc?.dialogue[page] ?? '';
  });

  // Is on last page
  readonly isLastPage = computed(() => {
    return this._currentPage() >= this.totalPages() - 1;
  });

  // Has external link
  readonly hasExternalLink = computed(() => {
    return !!this._currentNPC()?.externalLink;
  });

  /**
   * Open dialogue with an NPC
   */
  open(npc: NPC): void {
    this._currentNPC.set(npc);
    this._currentPage.set(0);
  }

  /**
   * Go to next page or close if on last page
   */
  next(): void {
    if (!this.isOpen()) return;

    if (this.isLastPage()) {
      // On last page - check for external link
      const npc = this._currentNPC();
      if (npc?.externalLink) {
        window.open(npc.externalLink, '_blank', 'noopener,noreferrer');
      }
      this.close();
    } else {
      // Go to next page
      this._currentPage.update((p) => p + 1);
    }
  }

  /**
   * Close dialogue
   */
  close(): void {
    this._currentNPC.set(null);
    this._currentPage.set(0);
  }
}
