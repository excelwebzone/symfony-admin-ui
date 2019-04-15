import $ from 'jquery';
import moment from 'moment';
import numeral from 'numeral';
import axios from '../../lib/utils/axios_utils';

export default class Dashboard {
  constructor(getReportCallback) {
    this.getReportCallback = getReportCallback;

    this.initDomElements();
    this.bindEvents();

    for (let report of this.$reports) {
      this.loadChart($(report));
    }
  }

  initDomElements() {
    this.$reports = $('.dashboard-report');
  }

  bindEvents() {
    $(document).on('block:loaded', '.js-report-block', (e) => this.initBlock(e));
    $(document).on('click', '.js-report-date-range-dropdown .option-list-item', (e) => this.selectDateRange(e));
  }

  initBlock(e) {
    const $block = $(e.currentTarget);

    // load reports in block
    const $reports = $block.find('.dashboard-report');
    for (let report of $reports) {
      this.loadChart($(report));
    }
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

    $target.closest('.card').find('.card-subheader').html(`
      <time datetime="${start.format('MM/DD/YYYY\THH:mm:ss.000\Z')}" title="${start.format('MMM DD, YYYY at HH:mm A')}">${start.format('MMM DD, YYYY')}</time>
      –
      <time datetime="${end.format('MM/DD/YYYY\THH:mm:ss.000\Z')}" title="${end.format('MMM DD, YYYY at HH:mm A')}">${end.format('MMM DD, YYYY')}</time>
    `);

    // update filter
    const $chart = $target.closest('.card').find('.chart-container-chart');
    $chart.data('endpoint', $chart.data('endpoint').replace(new RegExp(`%22${$chart.data('date-field')}%22%3A%7B%22unit%22%3A%22(.+)%22`), `%22${$chart.data('date-field')}%22%3A%7B%22unit%22%3A%22${$target.data('value')}%22`));

    // reload chart
    this.loadChart($target.closest('.card').find('.dashboard-report'));
  }

  loadChart($report) {
    const $chart = $report.find('.chart-container-chart');
    const $loading = $report.find('.chart-loading-overlay');
    const $total = $report.find('.dashboard-report-data-value');

    $chart.html('');
    $loading.show();

    // @tmp
    if ($chart.data('endpoint') === '#') {
      return;
    }

    axios.get($chart.data('endpoint'))
      .then(({ data }) => {
        $loading.hide();

        if ($total.length) {
          for (let total of $total) {
            const $total = $(total);
            const value = data.total[$total.data('name')];

            let format = '0,0a';
            if ($total.data('money')) format = '$0,0a';
            if ($total.data('percent')) format = '0,0a%';

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

        const reportFunc = this.getReportCallback($chart.data('report'));
        if (reportFunc) {
          reportFunc($chart, data.labels, data.items);
        }
      }).catch(() => $loading.hide());
  }
}
