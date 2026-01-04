import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
} from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-game-notification',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './game-notification.component.html',
  styleUrl: './game-notification.component.scss',
})
export class GameNotificationComponent {
  private notificationService = inject(NotificationService);

  readonly notification = this.notificationService.current;
  readonly hasNotification = this.notificationService.hasNotification;

  readonly typeClass = computed(() => {
    const n = this.notification();
    return n ? `notification-${n.type}` : '';
  });

  dismiss(): void {
    const n = this.notification();
    if (n) {
      this.notificationService.dismiss(n.id);
    }
  }
}
