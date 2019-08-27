import $ from 'jquery';
import moment from 'moment';
import numeral from 'numeral';
import axios from '../../lib/utils/axios_utils';
import bp from '../../breakpoints';

export default class Dashboard {
  constructor(getChartCallback, allowDecimals = true) {
    this.getChartCallback = getChartCallback;
    this.allowDecimals = allowDecimals;

    this.initDomElements();
    this.bindEvents();
    this.initBlock($('body'));
  }

  initDomElements() {
    this.$reports = $('.dashboard-report');
  }

  bindEvents() {
    $(document).on('block:loaded', '.js-report-block', (e) => this.initBlock(e));
    $(document).on('click', '.js-report-date-range-dropdown .option-list-item', (e) => this.selectDateRange(e));
  }

  initBlock(e) {
    this.processReports(Object.entries($(e.currentTarget).find('.dashboard-report')));
  }

  selectDateRange(e) {
    const $target = $(e.currentTarget);

    // update text
    $target.closest('.dropdown').find('.dropdown-text').text($target.text());

    // calculate date ranges
    const tmp = $target.data('value').split('_');
    let start = moment();
    let end = moment();
    if (tmp[0] === 'last') {
      start = start.subtract(1, tmp[1]);
      end = end.subtract(1, tmp[1]);
    }
    start = start.startOf(tmp[1]);
    end = end.endOf(tmp[1]);
    if (tmp[1] === 'week') {
      start = start.add(1, 'day');
      end = end.add(1, 'day');
    }

    const reports = [];

    const $card = $target.closest('.card');
    if ($card.length) {
      $card.find('.card-subheader').html(this.getDateRangeTitle(start, end));

      this.updateChartEndpoint($card.find('.chart-container-chart'), $target.data('value'));
      this.resetChart($card.find('.dashboard-report'));
      reports.push($card.find('.dashboard-report'));
    }

    const $reportFilter = $target.closest('.report-filter');
    if ($reportFilter.length) {
      $reportFilter.find('.report-filter-current-date').html(this.getDateRangeTitle(start, end));

      for (let report of $reportFilter.next('.report-container').find('.dashboard-report')) {
        this.updateChartEndpoint($(report).find('.chart-container-chart'), $target.data('value'));
        this.resetChart($(report));
        reports.push($(report));
      }
    }

    this.processReports(reports);
  }

  getDateRangeTitle(start, end) {
    return `
      <time datetime="${start.format('MM/DD/YYYY\THH:mm:ss.000\Z')}" title="${start.format('MMM DD, YYYY at HH:mm A')}">${start.format('MMM DD, YYYY')}</time>
      –
      <time datetime="${end.format('MM/DD/YYYY\THH:mm:ss.000\Z')}" title="${end.format('MMM DD, YYYY at HH:mm A')}">${end.format('MMM DD, YYYY')}</time>
    `;
  }

  updateChartEndpoint($chart, unit) {
    $chart.data('endpoint', $chart.data('endpoint').replace(new RegExp(`%22${$chart.data('date-field')}%22:%7B%22unit%22:%22(.+)%22%7D`), `%22${$chart.data('date-field')}%22:%7B%22unit%22:%22${unit}%22%7D`));
  }

  // executes Promises sequentially
  processReports(reports) {
    const concat = result => Array.prototype.concat.bind(result);
    const promiseConcat = func => result => func().then(concat(result));
    const promiseReduce = (promise, func) => promise.then(promiseConcat(func));
    const serial = funcs => funcs.reduce(promiseReduce, Promise.resolve([]));

    serial(reports.map(report => () => this.loadChart($(report))));
  }

  resetChart($report) {
    const $chart = $report.find('.chart-container-chart');
    const $loading = $report.find('.chart-loading-overlay');
    const $total = $report.find('.dashboard-report-data-value');

    if ($total.length) {
      for (let total of $total) {
        const $total = $(total);

        let format = '0';
        if ($total.data('money')) format = '$0';
        if ($total.data('percent')) format = '0%';

        $total.html(numeral(0).format(format));
      }
    }

    $chart.html('');
    $loading.show();
  }

  loadChart($report) {
    if ($report.length === 0) {
      return Promise.resolve();
    }

    const $chart = $report.find('.chart-container-chart');
    const $loading = $report.find('.chart-loading-overlay');
    const $total = $report.find('.dashboard-report-data-value');

    this.resetChart($report);

    // @tmp
    if ($chart.data('endpoint') === '#') {
      return Promise.resolve();
    }

    return axios.get($chart.data('endpoint'))
      .then(({ data }) => {
        $loading.hide();

        if ($total.length) {
          for (let total of $total) {
            const $total = $(total);
            let value = data.total[$total.data('name')];

            let format = '0,0[.]00';
            if ($total.data('money')) format = '$0,0[.]00';
            if ($total.data('percent')) {
              format = '0,0[.]00%';

              value /= 100; // @hack: value is a percent
            }

            if (!this.allowDecimals && !$chart.data('allow-decimals')) {
              format = format.replace('[.]00', '');
            }

            let html = numeral(value).format(format);
            if ($total.data('color')) {
              if (value > 0) {
                html = `<span class="text-success">+${html}</span>`;
              } else if (value < 0) {
                html = `<span class="text-danger">${html}</span>`;
              }
            }

            $total.html(html);
          }
        }

        const chartFunc = this.getChartCallback($chart.data('token'));
        if (chartFunc) {
          const colors = $chart.data('colors') || null;
          const format = $chart.data('format');

          // @hack: set chart height based on container
          if (bp.getBreakpointSize() !== 'lg') {
            $chart.height($chart.parent().height());
          }

          chartFunc($chart, data.labels, data.items, colors, format);
        }
      }).catch(() => $loading.hide());
  }
}
