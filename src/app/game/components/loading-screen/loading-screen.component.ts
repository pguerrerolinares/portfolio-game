import {
  Component,
  ChangeDetectionStrategy,
  input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-loading-screen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loading-screen.component.html',
  styleUrl: './loading-screen.component.scss',
  imports: [TranslateModule],
})
export class LoadingScreenComponent {
  readonly progress = input(0);
}
