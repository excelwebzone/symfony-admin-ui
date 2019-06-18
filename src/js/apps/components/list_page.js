import $ from 'jquery';
import numeral from 'numeral';
import Odometer from 'odometer';
import axios from '../../lib/utils/axios_utils';
import toaster from '../../lib/utils/toaster';
import DataViewer from './data_viewer';

export default class ListPage {
  constructor(containerEl, getChartCallback = null, allowDecimals = true) {
    this.getChartCallback = getChartCallback;
    this.allowDecimals = allowDecimals;

    this.initDomElements(containerEl);
    this.bindEvents();
    this.createDataViewer();
  }

  initDomElements(containerEl) {
    this.$container = containerEl ? $(containerEl) : $('body');

    this.$selectAllCheckbox = this.$container.find('.js-bulk-select-all');
    this.$chartTotals = this.$container.find('.list-chart-summary-number-item');
    this.$chartContainer = this.$container.find('.chart-container-chart');
    this.$chartLoading = this.$container.find('.chart-loading-overlay');

    this.odCurrencies = {};
    for (let currency of this.$container.find('.js-odometer-currency')) {
      this.odCurrencies[$(currency).data('currency-field')] = new Odometer({
        el: currency,
        duration: 200,
        format: '(,ddd)',
        theme: 'default'
      });
    }
  }

  bindEvents() {
    $(document).on('reload:list', '.js-list-page-activity-log-form', () => {
      this.dataViewer.getFilter().loadActiveFilter();
    });

    this.$container.on('click', 'input[name=groupingType]', () => this.dataViewer.filterData());

    this.$selectAllCheckbox.on('click', () => this.selectAllRows());
    this.$container.find('.js-bulk-select').on('click', () => this.selectRow());

    this.$container.find('.js-print-list').on('click', (e) => this.printList(e));
    this.$container.find('.js-bulk-export,.js-bulk-print,.js-bulk-action').on('click', (e) => this.bulkGeneric(e));
    this.$container.find('.js-bulk-email').on('click', (e) => this.bulkMailto(e));
    this.$container.find('.js-bulk-follow').on('click', (e) => this.bulkFollow(e));
    this.$container.find('.js-bulk-complete').on('click', (e) => this.bulkComplete(e));
    this.$container.find('.js-bulk-unread').on('click', (e) => this.bulkUnread(e));
    this.$container.find('.js-bulk-edit').on('drawer:shown', (e, drawer) => this.bulkEditDrawer(e, drawer));
    this.$container.find('.js-bulk-delete').on('modal:shown', (e, modal) => this.bulkDeleteModal(e, modal));
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

        if (typeof data.totals === 'object') {
          for (let [key, value] of Object.entries(data.totals)) {
            const $span = viewer.$table.find(`.table-header-cell[data-field="${key}"] .table-header-cell-content>span`);

            // remove decimals
            if (!self.allowDecimals && value.indexOf('.') !== -1) {
              value = value.replace(/^(\W)?([0-9,]+)([0-9.]+)(\W)?$/g, '$1$2$4');
            }

            $span.append(`<span class="total-value ${value.replace(/\D/g, '') < 0 ? 'is-negative' : ''}">${value}</span>`);
          }
        }
      }

      if (data.currency && self.odCurrencies) {
        for (let [key, value] of Object.entries(data.currency)) {
          self.odCurrencies[key].update(value || 0);
        }
      }

      viewer.$table.trigger('data:received', data);
    };

    // run after append html
    const postCallback = (viewer, data) => {
      // auto select all new checkboxes when select-all is checked
      if (self.$selectAllCheckbox.is(':checked')) {
        self.$selectAllCheckbox.prop('checked', false);
        self.$selectAllCheckbox.click();
      }

      // automatically open single result (ignore under for multi block)
      if (data.page === 1 && data.total === 1
        && !viewer.$container.hasClass('js-ember-table-block')
        && !viewer.$table.hasClass('activity-list')
      ) {
        viewer.$table.find('.ember-table-body-container .ember-table-left-table-block>div .js-entity-drawer:eq(0)').click();
      }

      viewer.$table.trigger('data:loaded', data);
    };

    // run before reseting html
    const preFilterLoad = (viewer) => {
      const $dropdownCount = viewer.$container.find('.dropdown-count');
      if ($dropdownCount) {
        $dropdownCount.text(0);
      }

      const $headers = viewer.$table.find('.table-header-cell[data-field]');
      for (let header of $headers) {
        $(header).find('.table-header-cell-content>span>.total-value').remove();
      }

      if (self.odCurrency) {
        self.odCurrency.update(0);
      }
    };

    // run after setting
    const postFilterLoad = (viewer, filters) => {
      // load chart data
      if (self.$chartContainer.length && self.getChartCallback) {
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

            const chartFunc = self.getChartCallback(self.$chartContainer.data('token'));
            if (chartFunc) {
              chartFunc(self.$chartContainer, data.labels, data.items);
            }
          }).catch(() => self.$chartLoading.hide());
      }
    };

    // extends the filter request params
    const setFilterParams = (viewer) => {
      const params = {};

      const groupingType = $('input[name=groupingType]:checked');
      if (groupingType.length) {
        params.groupingType = groupingType.val();
      }

      if (viewer.$table.data('totals')) {
        params.showTotals = 1;
      }

      return params;
    };

    this.dataViewer = new DataViewer(this.$container, {
      preCallback: preCallback,
      postCallback: postCallback,
      preFilterLoad: preFilterLoad,
      postFilterLoad: postFilterLoad,
      setFilterParams: setFilterParams
    });
  }

  printList(e) {
    const params = {};
    if (this.dataViewer.getFilter().getData()) {
      params.filters = this.dataViewer.getFilter().getData();
    }
    if (this.dataViewer.getSortColumn()) {
      params.sort = this.dataViewer.getSortColumn();
    }

    axios.get($(e.currentTarget).data('endpoint'), {
      params: params
    })
      .then(({ data }) => {
        if (data.message) {
          toaster(data.message, 'default', data.actionConfig);
        }
      });
  }

  toggleBulkTools(toggle) {
    this.$container.find('.add-buttons-container').toggle(!toggle);
    this.$container.find('.bulk-buttons-container').toggle(toggle);
    this.$container.find('.bulk-buttons-container').find('.selection-count span').html(this.$container.find('.js-bulk-select:checked').length);
  }

  selectAllRows() {
    if (this.$container.find('.js-bulk-select').length === 0) {
      this.$selectAllCheckbox.prop('checked', false);
      return;
    }

    this.$container.find('.js-bulk-select').prop('checked', this.$selectAllCheckbox.is(':checked'));
    this.toggleBulkTools(this.$selectAllCheckbox.is(':checked'));
  }

  selectRow() {
    let checked = 0;
    for (let checkbox of this.$container.find('.js-bulk-select')) {
      if ($(checkbox).is(':checked')) {
        checked++;
      }
    }

    this.$selectAllCheckbox.prop('checked', checked === this.$container.find('.js-bulk-select').length);
    this.toggleBulkTools(checked > 0);
  }

  getSelectedItems() {
    let ids = [];
    for (let checkbox of this.$container.find('.js-bulk-select')) {
      if ($(checkbox).is(':checked')) {
        ids.push($(checkbox).val());
      }
    }
    return ids;
  }

  getFormData() {
    const ids = this.getSelectedItems();
    const formData = new FormData();
    for (let i = 0; i < ids.length; i++) {
      formData.set(`ids[${i}]`, ids[i]);
    }
    return formData;
  }

  bulkGeneric(e) {
    const self = this;
    const $button = $(e.currentTarget);
    axios.post($button.data('endpoint'), self.getFormData())
      .then(({ data }) => {
        if (data.message) {
          toaster(data.message, 'default', data.actionConfig);
        }
        if ($button.data('refresh')) {
          self.dataViewer.filterData();
          self.toggleBulkTools(false);

          const $drawer = $('.drawer-frame');
          if ($drawer.length) {
            $drawer.find('.js-drawer-close').click();
          }
        }
      });
  }

  bulkMailto(e) {
    const $button = $(e.currentTarget);
    axios.post($button.data('endpoint'), this.getFormData())
      .then(({ data }) => {
        if (data.emails.length) {
          location.href = 'mailto:' + encodeURIComponent(data.emails.join(', '));
        }
      });
  }

  bulkFollow(e) {
    const $button = $(e.currentTarget);
    const ids = this.getSelectedItems();
    axios.post($button.data('endpoint'), this.getFormData())
      .then(({ data }) => {
        if (data.message) {
          toaster(data.message, 'default', data.actionConfig);
        } else if (data.error) {
          toaster(data.error.message, 'error', data.actionConfig);
        }

        for (let id of ids) {
          const $emberRow = this.$container.find(`.js-entity-drawer[data-id="${id}"]`);
          if ($emberRow.length) {
            $emberRow.data('is-follow', !$emberRow.data('is-follow'));
            $emberRow.find('.js-follow-item').prop('checked', !$emberRow.find('.js-follow-item').prop('checked'));

            const $drawer = $(`.drawer-frame[data-id="${$emberRow.data('id')}"]`);
            if ($drawer.length) {
              $drawer.find('.js-follow-item>i')
                .toggleClass('zmdi-star-outline')
                .toggleClass('zmdi-star');
            }
          }
        }

        $button.trigger('item:bulk-follow');
      });
  }

  bulkComplete(e) {
    const $button = $(e.currentTarget);
    const ids = this.getSelectedItems();
    axios.post($button.data('endpoint'), this.getFormData())
      .then(({ data }) => {
        if (data.message) {
          toaster(data.message, 'default', data.actionConfig);
        } else if (data.error) {
          toaster(data.error.message, 'error', data.actionConfig);
        }

        for (let id of ids) {
          const $emberRowLeft = this.$container.find(`.js-entity-drawer[data-id="${id}"]`);
          if ($emberRowLeft.length) {
            $emberRowLeft.data('is-complete', !$emberRowLeft.data('is-complete'));
            $emberRowLeft.find('.task-check-box-container').toggleClass('is-completed');
            $emberRowLeft.find('.js-complete-item').prop('checked', !$emberRowLeft.find('.js-complete-item').prop('checked'));
            $emberRowLeft.find('.table-cell-name').toggleClass('is-completed');

            const $emberRowRight = $emberRowLeft.closest('.list-page-table').find('.ember-table-body-container .ember-table-right-table-block .ember-table-table-row').eq($emberRowLeft.index());
            $emberRowRight.find('.table-cell-name').toggleClass('is-completed');

            const $drawer = $(`.drawer-frame[data-id="${$emberRowLeft.data('id')}"]`);
            if ($drawer.length) {
              $drawer.toggleClass('is-complete');
              $drawer.find('.task-check-box-container').toggleClass('is-completed');
              $drawer.find('.js-complete-item').prop('checked', !$drawer.find('.js-complete-item').prop('checked'));
            }
          }
        }

        $button.trigger('item:bulk-complete');
      });
  }

  bulkUnread(e) {
    const $button = $(e.currentTarget);
    const ids = this.getSelectedItems();
    axios.post($button.data('endpoint'), this.getFormData())
      .then(({ data }) => {
        if (data.message) {
          toaster(data.message, 'default', data.actionConfig);
        } else if (data.error) {
          toaster(data.error.message, 'error', data.actionConfig);
        }

        for (let id of ids) {
          const $emberRow = this.$container.find(`.js-entity-drawer[data-id="${id}"]`);
          if ($emberRow.length) {
            $emberRow.toggleClass('is-unread');
          }
        }

        $button.trigger('item:bulk-unread');
      });
  }

  bulkEditDrawer(e, drawer) {
    const self = this;
    $(drawer).on('drawer:hidden', (e, data) => {
      $(drawer).off('drawer:hidden');

      if (data.total) {
        self.dataViewer.filterData();
        self.toggleBulkTools(false);
      }
    });
  }

  bulkDeleteModal(e, modal) {
    const self = this;
    const $button = $(e.currentTarget);
    const ids = self.getSelectedItems();
    $(modal).on('modal:hidden', (e, data) => {
      $(modal).off('modal:hidden');

      if (data.total) {
        self.dataViewer.filterData();
        self.toggleBulkTools(false);

        const $drawer = $('.drawer-frame');
        if ($drawer.length) {
          $drawer.find('.js-drawer-close').click();
        }
      }

      if ($button.data('trigger')) {
        $button.trigger($button.data('trigger'), { ids: ids });
      }
    });
  }
}
