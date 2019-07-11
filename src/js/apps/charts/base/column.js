import numeral from 'numeral';
import Highcharts from '../highcharts';

export default ($chart, categories, series, colors = null, format = null) => {
  Highcharts.chart({
    chart: {
      type: 'column',
      renderTo: $chart[0]
    },
    colors: colors && colors.length ? colors : Highcharts.getColors(),
    title: {
      text: null
    },
    xAxis: {
      categories: categories,
      crosshair: true
    },
    yAxis: {
      title: {
        text: null
      },
      labels: {
        formatter() {
          // @hack: value is a percent
          return numeral(format === 'percent' ? this.value / 100 : this.value).format(`${format === 'money' ? '$' : ''}0,0[.]00${format === 'percent' ? '%' : ''}`);
        }
      }
    },
    tooltip: {
      formatter: Highcharts.getSharedTooltipFormatter({
        // @hack: value is a percent
        valueFormatter: value => numeral(format === 'percent' ? value / 100 : value).format(`${format === 'money' ? '$' : ''}0,0[.]00${format === 'percent' ? '%' : ''}`)
      }),
      shared: !0
    },
    plotOptions: {
      column: {
        pointPadding: 0.2,
        borderWidth: 0
      }
    },
    series: series
  });
};
