import numeral from 'numeral';
import Highcharts from '../highcharts';

export default ($chart, categories, series, colors = null, moneyFormat = false) => {
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
    plotOptions: {
      column: {
        pointPadding: 0.2,
        borderWidth: 0
      }
    },
    series: series
  });
};
