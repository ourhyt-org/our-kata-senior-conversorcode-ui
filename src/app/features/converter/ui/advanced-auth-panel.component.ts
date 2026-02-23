import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-advanced-auth-panel',
  imports: [ReactiveFormsModule],
  templateUrl: './advanced-auth-panel.component.html',
  styleUrl: './advanced-auth-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedAuthPanelComponent {
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly submitted = output<{ email: string; password: string }>();

  readonly form = new FormBuilder().nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    this.submitted.emit(this.form.getRawValue());
  }
}
