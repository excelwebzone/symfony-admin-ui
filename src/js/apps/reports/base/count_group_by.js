import numeral from 'numeral';
import Highcharts from '../highcharts';

export default ($chart, categories, series, color = null) => {
  const minRowHeight = 25;
  const minHeight = (categories.length || 0) * minRowHeight + 110;

  Highcharts.chart({
    chart: {
      type: 'bar',
      height: Math.max(minHeight, 400),
      renderTo: $chart[0]
    },
    colors: Highcharts.getColors(color),
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
          return numeral(this.value).format('0,0[.]00');
        }
      },
      allowDecimals: !1
    },
    tooltip: {
      formatter: Highcharts.getTooltipFormatter({
        valueFormatter: value => numeral(value).format('0,0[.]00')
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
