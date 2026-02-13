import $ from 'jquery';
import axios from '../../lib/utils/axios_utils';

export default class Pager {
  constructor(
    containerEl,
    emptyEl,
    loadingEl,
    disable = false,
    callback = $.noop
  ) {
    this.$container = $(containerEl);
    this.$empty = $(emptyEl);
    this.$loading = $(loadingEl);

    this.url = this.$container.data('endpoint');
    if (!this.url) {
      throw new Error('Pager requires data-endpoint on container');
    }

    this.page = 1;
    this.limit = parseInt(this.$container.data('limit')) || 20;
    this.autoScroll = this.$container.data('auto-scroll') === undefined
      ? true
      : !!this.$container.data('auto-scroll');
    this.params = {};
    this.disable = disable;
    this.orgDisable = disable;
    this.callback = callback;

    this.initLoadMore();
  }

  setPage(page) {
    this.page = parseInt(page || 1);
  }

  setLimit(limit) {
    this.limit = parseInt(limit || 20);
  }

  setParams(params) {
    this.params = params || {};
  }

  getData() {
    this.$empty.hide();
    this.$loading.show();

    axios.get(this.url, {
      params: $.extend(this.params, {
        page: this.page,
        limit: this.limit
      })
    })
      .then(({ data }) => {
        this.append(data);
        this.callback(data);

        // keep loading until we've filled the viewport height
        if (!this.disable && !this.isScrollable()) {
          this.getData();
        } else {
          this.$loading.hide();
        }
      }).catch(() => this.$loading.hide());
  }

  append(data) {
    if (data.page === 1) {
      this.disable = this.orgDisable;
    }

    if (data.count === 0 || data.count === data.total) {
      this.disable = true;
    }

    if (data.count === 0 && this.page === 1) {
      this.$empty.show();
    }

    this.page++;
  }

  isScrollable() {
    const $scroller = this.$container.find('.antiscroll-inner');
    if ($scroller.length) {
      return this.$container.height() < $scroller.height() + 200;
    }

    return true;
  }

  initLoadMore() {
    if (!this.autoScroll) {
      return;
    }

    this.$container.find('.antiscroll-inner').on('reached-bottom', (e) => {
      if (!this.disable && !this.$loading.is(':visible')) {
        this.getData();
      }
    });
  }
}
