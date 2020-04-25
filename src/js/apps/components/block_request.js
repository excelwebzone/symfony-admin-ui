import $ from 'jquery';
import toaster from '../../lib/utils/toaster';
import axios from '../../lib/utils/axios_utils';
import { initFormElements } from '../form_elements/init_form_elements';

export default class BlockRequest {
  constructor() {
    this.bindEvents();
    this.open($('body'));
  }

  bindEvents() {
    $(document).on('click', '.js-block-request[data-click="true"]', (e) => this.click(e));
    $(document).on('click', '.js-block-request-tab', (e) => this.clickTab(e));
    $(document).on('block:load', '.js-block-request', (e) => this.load(e));
  }

  open($target) {
    for (let element of $target.find('.js-block-request')) {
      if (!$(element).data('click')) {
        $(element).trigger('block:load');
      }
    }
  }

  click(e) {
    $(e.currentTarget).trigger('block:load');
  }

  clickTab(e) {
    let $block = $($(e.currentTarget).data('target'));
    if (!$block.hasClass('js-block-request')) {
      $block = $block.children('.js-block-request');
    }
    if ($block.hasClass('js-block-request')) {
      $block.trigger('block:load');
    }
  }

  load(e) {
    const $block = $(e.currentTarget);
    let $target = $block;
    if ($block.data('target')) {
      $target = $($block.data('target'));
    }

    if (!$block.data('allow-reloading')) {
      $block.removeClass('js-block-request');
    }

    $block.addClass('is-loading');

    axios.get($block.data('endpoint'))
      .then(({ data }) => {
        $block.removeClass('is-loading');

        if (data.ok) {
          $target.html(data.html);

          initFormElements($target);

          $block.trigger('block:loaded');

          // recursive
          this.open($target);
        } else {
          toaster(data.error.message, 'error');
        }
      });
  }
}
