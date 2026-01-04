import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MenuBar, Menu, MenuItem } from '@angular/aria/menu';
import { TowerService } from '../../../core/services/tower.service';
import { PlayerControllerService } from '../../../core/services/player-controller.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SectionId } from '../../../core/models/world.model';

// Subsection info content
const SUBSECTION_INFO: Record<string, Record<string, { title: string; message: string }>> = {
  hero: {
    intro: { title: '🎮 Intro', message: 'Bienvenido a mi portfolio interactivo estilo pixel art' },
    tutorial: { title: '📖 Tutorial', message: 'Usa las flechas o toca la pantalla para mover al personaje' },
  },
  about: {
    bio: { title: '👤 Bio', message: 'Desarrollador frontend con pasión por crear experiencias únicas' },
    background: { title: '📚 Background', message: 'Mi trayectoria en el mundo del desarrollo web' },
  },
  skills: {
    frontend: { title: '🎨 Frontend', message: 'Angular, React, TypeScript, CSS/SCSS' },
    backend: { title: '⚙️ Backend', message: 'Node.js, Python, APIs REST' },
    tools: { title: '🛠️ Tools', message: 'Git, Docker, CI/CD, Testing' },
  },
  projects: {
    portfolio: { title: '💼 Portfolio', message: 'Proyectos destacados y casos de estudio' },
    opensource: { title: '🌐 Open Source', message: 'Contribuciones a la comunidad' },
  },
  contact: {
    email: { title: '📧 Email', message: 'Contáctame por correo electrónico' },
    linkedin: { title: '💼 LinkedIn', message: 'Conecta conmigo en LinkedIn' },
    github: { title: '🐙 GitHub', message: 'Revisa mi código en GitHub' },
  },
};

@Component({
  selector: 'app-menubar',
  templateUrl: './menubar.component.html',
  styleUrl: './menubar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MenuBar, Menu, MenuItem],
})
export class MenubarComponent {
  private tower = inject(TowerService);
  private player = inject(PlayerControllerService);
  private notifications = inject(NotificationService);

  // Current section ID (from TowerService)
  readonly currentSectionId = this.tower.currentSection;

  // Check if player is in a specific section
  isInSection(sectionId: string): boolean {
    return this.currentSectionId() === sectionId;
  }

  navigate(section: string): void {
    // Teleport player to NPC position in section
    const npcPos = this.tower.getNPCPositionForSection(section as SectionId);
    this.player.teleportTo(npcPos.x, npcPos.y);
  }

  showInfo(sectionId: string, subsectionKey: string): void {
    const info = SUBSECTION_INFO[sectionId]?.[subsectionKey];
    if (info) {
      this.notifications.showInfo(info.title, info.message, 6000);
    }
  }
}
