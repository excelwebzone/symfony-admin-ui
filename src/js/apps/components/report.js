import $ from 'jquery';
import numeral from 'numeral';
import axios from '../../lib/utils/axios_utils';
import DataViewer from './data_viewer';

export default class Report {
  constructor(getReportCallback) {
    this.getReportCallback = getReportCallback;

    this.initDomElements();
    this.bindEvents();
    this.createDataViewer();
  }

  initDomElements() {
    this.$container = $('body');

    this.$chartTotals = this.$container.find('.report-summary-number-item');
    this.$chartContainer = this.$container.find('.chart-container-chart');
    this.$chartLoading = this.$container.find('.chart-loading-overlay');
  }

  bindEvents() {
    this.$container.on('click', 'input[name=groupingType]', () => this.dataViewer.filterData());
  }

  createDataViewer() {
    const self = this;

    // run before reseting html
    const preFilterLoad = (data) => {
      if (this.odCurrency) {
        this.odCurrency.update(0);
      }
    };

    // run after setting
    const postFilterLoad = (filters) => {
      // load chart data
      if (self.$chartContainer.length) {
        self.$chartLoading.show();
        self.$chartContainer.html('');

        const params = { filters: filters };
        const groupingType = $('input[name=groupingType]:checked');
        if (groupingType.length) {
          params.groupingType = groupingType.val();
        }

        axios.get(self.$chartContainer.data('endpoint'), {
          params: params
        })
          .then(({ data }) => {
            self.$chartLoading.hide();

            for (let total of self.$chartTotals) {
              const $total = $(total).find('>div:eq(0)');

              let format = '0,0a';
              if ($total.data('money')) format = '$0,0a';
              if ($total.data('percent')) format = '0,0a%';

              $total.html(numeral(data.total[$total.data('name')]).format(format));
            }

            const reportFunc = this.getReportCallback(self.$chartContainer.data('report'));
            if (reportFunc) {
              reportFunc(self.$chartContainer, data.labels, data.items);
            }
          }).catch(() => self.$chartLoading.hide());
      }
    };

    this.dataViewer = new DataViewer(this.$container, {
      preFilterLoad: preFilterLoad,
      postFilterLoad: postFilterLoad
    });
  }
}
