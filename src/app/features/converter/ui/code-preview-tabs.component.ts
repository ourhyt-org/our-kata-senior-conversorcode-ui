import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { InlineFile } from '../../../core/conversion-api/conversion-api.models';

@Component({
  selector: 'app-code-preview-tabs',
  templateUrl: './code-preview-tabs.component.html',
  styleUrl: './code-preview-tabs.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodePreviewTabsComponent {
  readonly files = input<InlineFile[]>([]);
  readonly selectedPath = input<string | null>(null);
  readonly selectFile = output<string>();

  readonly selectedFile = computed(() => {
    const files = this.files();
    if (files.length === 0) {
      return null;
    }
    return files.find((file) => file.path === this.selectedPath()) ?? files[0];
  });
}
