import numeral from 'numeral';
import Highcharts from '../highcharts';

export default ($chart, categories, series, colors = null, format = null) => {
  Highcharts.chart({
    chart: {
      type: 'line',
      renderTo: $chart[0]
    },
    colors: colors && colors.length ? colors : Highcharts.getColors(),
    title: {
      text: null
    },
    xAxis: {
      categories: categories
    },
    yAxis: {
      title: {
        text: null
      },
      labels: {
        formatter() {
          return numeral(this.value).format(`${format === 'money' ? '$' : ''}0,0[.]00${format === 'percent' ? '%' : ''}`);
        }
      }
    },
    tooltip: {
      formatter: Highcharts.getSharedTooltipFormatter({
        valueFormatter: value => numeral(value).format(`${format === 'money' ? '$' : ''}0,0[.]00${format === 'percent' ? '%' : ''}`)
      }),
      shared: !0
    },
    series: series
  });
};
