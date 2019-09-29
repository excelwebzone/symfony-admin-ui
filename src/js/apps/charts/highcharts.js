import $ from 'jquery';
import _ from 'underscore';
import Highcharts from 'highcharts';

Highcharts.theme = {
  credits: {
    enabled: !1
  },
  chart: {
    backgroundColor: 'transparent',
    plotBackgroundColor: null,
    style: {
      fontFamily: 'Roboto'
    }
  },
  title: {
    text: null
  },
  exporting: {
    enabled: !1
  },
  legend: {
    padding: 8,
    symbolPadding: 5,
    itemDistance: 20,
    margin: 12,
    verticalAlign: 'bottom',
    align: 'center',
    layout: 'horizontal',
    symbolHeight: 12,
    symbolWidth: 12,
    symbolRadius: 6,
    borderWidth: 0,
    itemStyle: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },
    labelFormatter() {
      return _.escape(this.name);
    }
  },
  xAxis: {},
  yAxis: {
    gridLineColor: '#e9e9e9'
  },
  lang: {
    numericSymbols: ['K', 'M', 'B', 'T', 'Q', 'E']
  },
  plotOptions: {
    series: {
      fillOpacity: 0.9,
      shadow: !1,
      lineWidth: 3,
      marker: {
        enabled: !1,
        symbol: 'circle'
      }
    }
  },
  tooltip: {
    followPointer: !0,
    animation: !1,
    useHTML: !0,
    backgroundColor: '#ffffff',
    borderWidth: 0,
    crosshairs: {
      dashStyle: 'solid',
      width: 1,
      color: '#e9e9e9'
    },
    itemMarginBottom: 10,
    style: {
      padding: '15px',
      lineHeight: '22px'
    }
  }
};

Highcharts.setOptions(Highcharts.theme);

const COLORS = {
  RED: { 50: '#FFEBEE', 100: '#FFCDD2', 200: '#EF9A9A', 300: '#E57373', 400: '#EF5350', 500: '#F44336', 600: '#E53935', 700: '#D32F2F', 800: '#C62828', 900: '#B71C1C' },
  PINK: { 50: '#FCE4EC', 100: '#F8BBD0', 200: '#F48FB1', 300: '#F06292', 400: '#EC407A', 500: '#E91E63', 600: '#D81B60', 700: '#C2185B', 800: '#AD1457', 900: '#880E4F' },
  PURPLE: { 50: '#F3E5F5', 100: '#E1BEE7', 200: '#CE93D8', 300: '#BA68C8', 400: '#AB47BC', 500: '#9C27B0', 600: '#8E24AA', 700: '#7B1FA2', 800: '#6A1B9A', 900: '#4A148C' },
  DEEP_PURPLE: { 50: '#EDE7F6', 100: '#D1C4E9', 200: '#B39DDB', 300: '#9575CD', 400: '#7E57C2', 500: '#673AB7', 600: '#5E35B1', 700: '#512DA8', 800: '#4527A0', 900: '#311B92' },
  INDIGO: { 50: '#E8EAF6', 100: '#C5CAE9', 200: '#9FA8DA', 300: '#7986CB', 400: '#5C6BC0', 500: '#3F51B5', 600: '#3949AB', 700: '#303F9F', 800: '#283593', 900: '#1A237E' },
  BLUE: { 50: '#E3F2FD', 100: '#BBDEFB', 200: '#90CAF9', 300: '#64B5F6', 400: '#42A5F5', 500: '#2196F3', 600: '#1E88E5', 700: '#1976D2', 800: '#1565C0', 900: '#0D47A1' },
  LIGHT_BLUE: { 50: '#E1F5FE', 100: '#B3E5FC', 200: '#81D4FA', 300: '#4FC3F7', 400: '#29B6F6', 500: '#03A9F4', 600: '#039BE5', 700: '#0288D1', 800: '#0277BD', 900: '#01579B' },
  CYAN: { 50: '#E0F7FA', 100: '#B2EBF2', 200: '#80DEEA', 300: '#4DD0E1', 400: '#26C6DA', 500: '#00BCD4', 600: '#00ACC1', 700: '#0097A7', 800: '#00838F', 900: '#006064' },
  TEAL: { 50: '#E0F2F1', 100: '#B2DFDB', 200: '#80CBC4', 300: '#4DB6AC', 400: '#26A69A', 500: '#009688', 600: '#00897B', 700: '#00796B', 800: '#00695C', 900: '#004D40' },
  GREEN: { 50: '#E8F5E9', 100: '#C8E6C9', 200: '#A5D6A7', 300: '#81C784', 400: '#66BB6A', 500: '#4CAF50', 600: '#43A047', 700: '#388E3C', 800: '#2E7D32', 900: '#1B5E20' },
  LIGHT_GREEN: { 50: '#F1F8E9', 100: '#DCEDC8', 200: '#C5E1A5', 300: '#AED581', 400: '#9CCC65', 500: '#8BC34A', 600: '#7CB342', 700: '#689F38', 800: '#558B2F', 900: '#33691E' },
  LIME: { 50: '#F9FBE7', 100: '#F0F4C3', 200: '#E6EE9C', 300: '#DCE775', 400: '#D4E157', 500: '#CDDC39', 600: '#C0CA33', 700: '#AFB42B', 800: '#9E9D24', 900: '#827717' },
  YELLOW: { 50: '#FFFDE7', 100: '#FFF9C4', 200: '#FFF59D', 300: '#FFF176', 400: '#FFEE58', 500: '#FFEB3B', 600: '#FDD835', 700: '#FBC02D', 800: '#F9A825', 900: '#F57F17' },
  AMBER: { 50: '#FFF8E1', 100: '#FFECB3', 200: '#FFE082', 300: '#FFD54F', 400: '#FFCA28', 500: '#FFC107', 600: '#FFB300', 700: '#FFA000', 800: '#FF8F00', 900: '#FF6F00' },
  ORANGE: { 50: '#FFF3E0', 100: '#FFE0B2', 200: '#FFCC80', 300: '#FFB74D', 400: '#FFA726', 500: '#FF9800', 600: '#FB8C00', 700: '#F57C00', 800: '#EF6C00', 900: '#E65100' },
  DEEP_ORANGE: { 50: '#FBE9E7', 100: '#FFCCBC', 200: '#FFAB91', 300: '#FF8A65', 400: '#FF7043', 500: '#FF5722', 600: '#F4511E', 700: '#E64A19', 800: '#D84315', 900: '#BF360C' },
  BROWN: { 50: '#EFEBE9', 100: '#D7CCC8', 200: '#BCAAA4', 300: '#A1887F', 400: '#8D6E63', 500: '#795548', 600: '#6D4C41', 700: '#5D4037', 800: '#4E342E', 900: '#3E2723' },
  GREY: { 50: '#FAFAFA', 100: '#F5F5F5', 200: '#EEEEEE', 300: '#E0E0E0', 400: '#BDBDBD', 500: '#9E9E9E', 600: '#757575', 700: '#616161', 800: '#424242', 900: '#212121' },
  BLUE_GREY: { 50: '#ECEFF1', 100: '#CFD8DC', 200: '#B0BEC5', 300: '#90A4AE', 400: '#78909C', 500: '#607D8B', 600: '#546E7A', 700: '#455A64', 800: '#37474F', 900: '#263238' }
};

const CHART_COLORS = [
  COLORS.RED,
  COLORS.PURPLE,
  COLORS.INDIGO,
  COLORS.LIGHT_BLUE,
  COLORS.TEAL,
  COLORS.LIGHT_GREEN,
  COLORS.YELLOW,
  COLORS.ORANGE
];

function getColors(colorName = null) {
  if (!colorName || _.isUndefined(COLORS[colorName.toUpperCase()])) {
    colorName = 'PURPLE';
  }

  let colorIndex = CHART_COLORS.indexOf(COLORS[colorName.toUpperCase()]);
  colorIndex = Math.max(0, colorIndex);

  const colors = [];
  for (let i = 0; i < CHART_COLORS.length; ++i) {
    colors.push(CHART_COLORS[(colorIndex + i) % CHART_COLORS.length]);
  }

  const arrangeColors = (charts, sizes) => {
    const colors = [];
    sizes.forEach((size) => {
      charts.forEach((chart) => {
        if (size in chart) {
          colors.push(chart[size]);
        }
      });
    });
    return colors;
  };

  return arrangeColors(colors, [500, 300, 200, 700, 900]);
}

function getTooltipTitle(key, formatter) {
  return typeof formatter === 'function' ? formatter(key) : key;
}

function addTooltipHeader(html, colspan = 1) {
  return $('<thead>').append(
    $('<tr>').append(
      $(`<td colspan=${colspan}>`).append(
        $('<h3 class="font-weight-bold pb-2 highchart-tooltip-title">').html(html)
      )
    )
  );
}

function addTooltipRow(point, data = {}) {
  return $('<tr>')
    .append(
      $('<td>').append(
        $('<h5 class="font-weight-bold pr-2">').css({
          color: point.series.color,
          'max-width': '300px'
        })
          .text(`${point.series.name}:`)
      )
    ).append(
      $('<td>').append(
        $('<h5 class="text-right">').text(
          getTooltipTitle(point.y, data.valueFormatter)
        )
      )
    );
}

function getTooltipFormatter(data) {
  data = data || {};
  return function() {
    const $table = $(`<table class="${data.className ? data.className : ''}">`);

    const $header = addTooltipHeader(getTooltipTitle(this.key, data.titleFormatter), 2);

    const $body = $('<tbody>');

    $body.append(addTooltipRow(this.point, data));
    $table.append($header).append($body);
    return $table[0].outerHTML;
  };
}

function getSharedTooltipFormatter(data) {
  data = data || {};
  return function() {
    const $table = $('<table>');

    const $header = addTooltipHeader(getTooltipTitle(this.points[0].key, data.titleFormatter), 2);

    const $body = $('<tbody>');

    this.points.forEach((point) => {
      $body.append(addTooltipRow(point, data));
    });
    $table.append($header).append($body);
    return $table[0].outerHTML;
  };
}

export default {
  chart: function(highChartConfig) {
    return new Highcharts.Chart(highChartConfig);
  },
  getColors: getColors,
  getTooltipFormatter: getTooltipFormatter,
  getSharedTooltipFormatter: getSharedTooltipFormatter
};
