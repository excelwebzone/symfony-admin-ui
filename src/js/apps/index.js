import $ from 'jquery';
import EntityDrawer from '../entity_drawer';
import EntityModal from '../entity_modal';
import EntityForm from '../entity_form';
import EntityView from '../entity_view';
import toaster from '../lib/utils/toaster';
import axios from '../lib/utils/axios_utils';
import EmberTable from './components/ember_table';
import { initFormElements } from './form_elements/init_form_elements';

document.addEventListener('DOMContentLoaded', () => {
  new EntityModal();
  new EntityDrawer();
  new EntityForm();
  new EntityView();

  for (let element of $('.import-table-panel,.report-table-component')) {
    new EmberTable($(element).find('.js-ember-table'));
  }

  // Load blocks via Ajax request
  $(document).on('block:load', '.js-block-request', (e) => {
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
          for (let element of $('.js-block-request', $target)) {
            if (!$(element).data('click')) {
              $(element).trigger('block:load');
            }
          }
        } else {
          toaster(data.error.message, 'error');
        }
      });
  });
  for (let element of $('.js-block-request')) {
    if (!$(element).data('click')) {
      $(element).trigger('block:load');
    }
  }

  $(document).on('click', '.js-block-request[data-click="true"]', (e) => {
    $(e.currentTarget).trigger('block:load');
  });

  $(document).on('click', '.js-block-request-tab', (e) => {
    let $block = $($(e.currentTarget).data('target'));
    if (!$block.hasClass('js-block-request')) {
      $block = $block.children('.js-block-request');
    }
    if ($block.hasClass('js-block-request')) {
      $block.trigger('block:load');
    }
  });
});
