import numeral from 'numeral';
import Highcharts from '../highcharts';

export default ($chart, categories, series, colors = null, moneyFormat = false) => {
  Highcharts.chart({
    chart: {
      type: 'bar',
      renderTo: $chart[0]
    },
    colors: colors && colors.length ? colors : Highcharts.getColors(),
    title: {
      text: null
    },
    xAxis: {
      categories: categories,
      labels: {
        x: -20
      }
    },
    yAxis: {
      title: {
        text: null
      },
      labels: {
        rotation: -45,
        formatter() {
          return numeral(this.value).format(`${moneyFormat ? '$' : ''}0,0[.]00`);
        }
      },
      allowDecimals: !1
    },
    tooltip: {
      formatter: Highcharts.getTooltipFormatter({
        valueFormatter: value => numeral(value).format(`${moneyFormat ? '$' : ''}0,0[.]00`)
      }),
      shared: !1
    },
    legend: {
      useHTML: true
    },
    plotOptions: {
      column: {
        pointPadding: 0.2,
        borderWidth: 0
      },
      series: {
        stacking: 'normal'
      }
    },
    series: series
  });
};
