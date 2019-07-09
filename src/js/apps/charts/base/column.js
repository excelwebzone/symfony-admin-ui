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
    subtitle: {
      text: null
    },
    xAxis: {
      categories: categories,
      tickmarkPlacement: 'off',
      title: {
        enabled: !0
      },
      labels: {
        step: 3,
        style: {
          fontWeight: '600',
          color: '#888888'
        }
      }
    },
    yAxis: {
      title: {
        text: null
      },
      labels: {
        formatter() {
          return numeral(this.value).format(`${moneyFormat ? '$' : ''}0,0[.]00`);
        }
      },
      allowDecimals: !0
    },
    tooltip: {
      formatter: Highcharts.getSharedTooltipFormatter({
        valueFormatter: value => numeral(value).format(`${moneyFormat ? '$' : ''}0,0[.]00`)
      }),
      shared: !0
    },
    plotOptions: {
      series: {
        stacking: 'normal',
        lineColor: '#e9e9e9',
        lineWidth: 1,
        marker: {
          lineWidth: 1,
          lineColor: '#e9e9e9'
        }
      }
    },
    series: series
  });
};