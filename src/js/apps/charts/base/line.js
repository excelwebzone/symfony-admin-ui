import numeral from 'numeral';
import Highcharts from '../highcharts';

export default ($chart, categories, series, colors = null, moneyFormat = false) => {
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
          return numeral(this.value).format(`${moneyFormat ? '$' : ''}0,0[.]00`);
        }
      }
    },
    tooltip: {
      formatter: Highcharts.getSharedTooltipFormatter({
        valueFormatter: value => numeral(value).format(`${moneyFormat ? '$' : ''}0,0[.]00`)
      }),
      shared: !0
    },
    series: series
  });
};
