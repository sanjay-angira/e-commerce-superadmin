import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-table-skeleton',
  templateUrl: './table-skeleton.component.html',
  styleUrl: './table-skeleton.component.scss',
})
export class TableSkeletonComponent {
  readonly headers = input<string[]>([]);
  readonly columns = input(5);
  readonly rows = input(8);
  readonly showPaginator = input(false);

  readonly colCount = computed(() => this.headers().length || this.columns());
  readonly colIndexes = computed(() => Array.from({ length: this.colCount() }, (_, i) => i));
  readonly rowIndexes = computed(() => Array.from({ length: this.rows() }, (_, i) => i));
}
