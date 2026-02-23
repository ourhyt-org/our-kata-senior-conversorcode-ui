import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrl: './button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  readonly type = input<'button' | 'submit'>('button');
  readonly variant = input<'primary' | 'secondary'>('primary');
  readonly disabled = input(false);
  readonly ariaLabel = input('button');
}
