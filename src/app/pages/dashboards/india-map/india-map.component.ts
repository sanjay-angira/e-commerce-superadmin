import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import Highcharts from 'highcharts/esm/highmaps';
import { ThemeService } from '../../../core/services/theme.service';

const INDIA_MAP_TOPOLOGY_URL =
  'https://code.highcharts.com/mapdata/countries/in/in-all.topo.json';

export type WarehouseSummary = {
  id: number | string;
  name?: string;
  city?: string;
  state?: string;
};

export type AddressSummary = {
  id: number | string;
  city?: string;
  state?: string;
  pincode?: number | string;
};

type MapPointCustom = {
  type?: string;
  warehouse?: WarehouseSummary;
  address?: AddressSummary;
  city?: string;
  state?: string;
  pincode?: number | string;
};

@Component({
  selector: 'app-india-map',
  templateUrl: './india-map.component.html',
  styleUrl: './india-map.component.scss',
})
export class IndiaMapComponent implements AfterViewInit {
  private readonly theme = inject(ThemeService);
  private readonly destroyRef = inject(DestroyRef);

  readonly routeLines = input<Highcharts.SeriesMaplineDataOptions[]>([]);
  readonly warehousePoints = input<Highcharts.SeriesMappointDataOptions[]>([]);
  readonly customerPoints = input<Highcharts.SeriesMappointDataOptions[]>([]);

  readonly loading = signal(true);
  readonly error = signal('');

  @ViewChild('mapHost') private mapHost?: ElementRef<HTMLDivElement>;

  private topology: Highcharts.GeoJSON | Highcharts.TopoJSON | undefined;
  private chart?: Highcharts.Chart;
  private viewReady = false;

  constructor() {
    effect(() => {
      this.theme.mode();
      this.routeLines();
      this.warehousePoints();
      this.customerPoints();
      untracked(() => this.renderMap());
    });

    this.destroyRef.onDestroy(() => this.destroyChart());
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.loadTopology();
  }

  private loadTopology(): void {
    const controller = new AbortController();
    this.destroyRef.onDestroy(() => controller.abort());

    this.loading.set(true);
    this.error.set('');
    fetch(INDIA_MAP_TOPOLOGY_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Map topology failed (${response.status})`);
        }
        return response.json();
      })
      .then((topology: Highcharts.GeoJSON | Highcharts.TopoJSON) => {
        this.topology = topology;
        this.loading.set(false);
        this.renderMap();
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        this.error.set('Could not load the India map. Check your network and try again.');
        this.loading.set(false);
      });
  }

  private renderMap(): void {
    if (!this.viewReady || !this.topology || !this.mapHost || this.loading() || this.error()) {
      return;
    }

    this.destroyChart();
    this.chart = Highcharts.mapChart(this.mapHost.nativeElement, this.buildOptions());
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
  }

  private buildOptions(): Highcharts.Options {
    const topology = this.topology!;
    const indiaPolygons = Highcharts.geojson(topology);
    const indiaBorders = Highcharts.geojson(topology, 'mapline');
    const dark = this.theme.isDark();
    const textColor = dark ? '#e6e8ee' : '#18181b';
    const tooltipFormatter = this.getMapTooltip.bind(this);

    return {
      chart: {
        map: topology,
        backgroundColor: 'transparent',
        spacing: [10, 10, 10, 10],
        height: 520,
      },
      title: {
        text: 'Warehouses → Customer Locations',
        style: { color: textColor, fontSize: '14px', fontWeight: '500' },
      },
      credits: { enabled: false },
      legend: {
        enabled: true,
        align: 'right',
        verticalAlign: 'bottom',
        itemStyle: { color: textColor },
      },
      mapNavigation: {
        enabled: true,
        buttonOptions: { verticalAlign: 'top' },
      },
      tooltip: {
        useHTML: true,
        formatter: function () {
          const context = this as { point?: Highcharts.Point };
          return tooltipFormatter(context.point as Highcharts.Point & { custom?: MapPointCustom });
        },
      },
      series: [
        {
          type: 'map',
          name: 'India',
          data: indiaPolygons,
          nullColor: dark ? '#1e3a5f' : '#dbeafe',
          borderColor: dark ? '#8b91f7' : '#1d4ed8',
          borderWidth: 1.4,
          showInLegend: false,
          enableMouseTracking: false,
          opacity: 0.85,
        },
        {
          type: 'mapline',
          name: 'State borders',
          data: indiaBorders,
          color: dark ? '#6366f1' : '#2563eb',
          showInLegend: false,
          enableMouseTracking: false,
          lineWidth: 1,
        },
        {
          type: 'mapline',
          name: 'Routes',
          data: this.routeLines(),
          lineWidth: 2,
          color: '#fb923c',
          enableMouseTracking: true,
          showInLegend: true,
        },
        {
          type: 'mappoint',
          name: 'Warehouses',
          data: this.warehousePoints(),
          color: '#1d4ed8',
        },
        {
          type: 'mappoint',
          name: 'Customers',
          data: this.customerPoints(),
          color: '#be123c',
        },
      ],
    };
  }

  private getMapTooltip(point?: Highcharts.Point & { custom?: MapPointCustom }): string {
    const custom =
      point?.custom || ((point?.options as { custom?: MapPointCustom } | undefined)?.custom);
    if (!point || !point.series) {
      return '';
    }

    if (point.series.type === 'mapline' && custom) {
      const warehouse = custom.warehouse;
      const address = custom.address;
      return `
        <div class="india-map-tip">
          <div class="tip-title">${point.name || 'Route'}</div>
          <div><strong>Warehouse:</strong> ${warehouse?.name || warehouse?.city || '—'}</div>
          <div class="tip-muted">${warehouse?.city || ''}${warehouse?.state ? ', ' + warehouse.state : ''}</div>
          <div><strong>Customer:</strong> ${address?.city || '—'}</div>
          <div class="tip-muted">${address?.state || ''}${address?.pincode ? ', ' + address.pincode : ''}</div>
        </div>
      `;
    }

    if (point.series.type === 'mappoint' && custom) {
      const title = custom.type === 'warehouse' ? 'Warehouse' : 'Customer';
      return `
        <div class="india-map-tip">
          <div class="tip-title">${point.name || title}</div>
          <div>${title}</div>
          <div class="tip-muted">${custom.city || ''}${custom.state ? ', ' + custom.state : ''}${
            custom.pincode ? ' (' + custom.pincode + ')' : ''
          }</div>
        </div>
      `;
    }

    return `<div class="india-map-tip"><div class="tip-title">${point.name || ''}</div></div>`;
  }
}
