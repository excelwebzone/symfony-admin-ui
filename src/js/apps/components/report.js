import $ from 'jquery';
import numeral from 'numeral';
import axios from '../../lib/utils/axios_utils';
import toaster from '../../lib/utils/toaster';
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
    this.$container.on('click', '.js-print-report', (e) => this.printReport(e));
  }

  createDataViewer() {
    const self = this;

    // run before append html
    const preCallback = (viewer, data) => {
      if (data.page === 1) {
        const $dropdownCount = viewer.$container.find('.dropdown-count');
        if ($dropdownCount) {
          $dropdownCount.text(data.total);
        }
      }

      if (data.currency && self.odCurrencies) {
        for (let [key, value] of Object.entries(data.currency)) {
          self.odCurrencies[key].update(value || 0);
        }
      }

      viewer.$table.trigger('data:received', data);
    };

    // run before reseting html
    const preFilterLoad = (viewer) => {
      const $dropdownCount = viewer.$container.find('.dropdown-count');
      if ($dropdownCount) {
        $dropdownCount.text(0);
      }

      if (self.odCurrency) {
        self.odCurrency.update(0);
      }
    };

    // run after setting
    const postFilterLoad = (viewer, filters) => {
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

    // extends the filter request params
    const setFilterParams = (viewer) => {
      const groupingType = $('input[name=groupingType]:checked');
      if (groupingType.length) {
        return { groupingType: groupingType.val() };
      }
    };

    this.dataViewer = new DataViewer(this.$container, {
      preCallback: preCallback,
      preFilterLoad: preFilterLoad,
      postFilterLoad: postFilterLoad,
      setFilterParams: setFilterParams
    });
  }

  printReport(e) {
    const params = {};
    if (this.dataViewer.getFilter().getData()) {
      params.filters = this.dataViewer.getFilter().getData();
    }
    if (this.dataViewer.getSortColumn()) {
      params.sort = this.dataViewer.getSortColumn();
    }

    axios.post($(e.currentTarget).data('endpoint'), params)
      .then(({ data }) => {
        if (data.message) {
          toaster(data.message, 'default', data.actionConfig);
        }
      });
  }
}
