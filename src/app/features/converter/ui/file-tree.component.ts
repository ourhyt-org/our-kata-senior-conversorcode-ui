import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { InlineFile } from '../../../core/conversion-api/conversion-api.models';

@Component({
  selector: 'app-file-tree',
  templateUrl: './file-tree.component.html',
  styleUrl: './file-tree.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileTreeComponent {
  readonly files = input<InlineFile[]>([]);
  readonly selectedPath = input<string | null>(null);
  readonly selectFile = output<string>();
}
