import $ from 'jquery';
import toaster from '../../lib/utils/toaster';
import axios from '../../lib/utils/axios_utils';

export default class ToggleObject {
  constructor() {
    this.bindEvents();
  }

  bindEvents() {
    $(document).on('click', '.js-toggle-object', (e) => this.toggle(e));
  }

  toggle(e) {
    const $link = $(e.currentTarget);
    axios.post($link.data('endpoint'))
      .then(({ data }) => {
        if (data.ok) {
          if ($link.data('message') || data.message) {
            toaster($link.data('message') || data.message);
          }

          if ($link.data('show-target')) {
            $($link.data('show-target')).show();
          }
          if ($link.data('hide-target')) {
            $($link.data('hide-target')).hide();
          }
          if ($link.data('toggle-target') && $link.data('toggle-class')) {
            $($link.data('toggle-target')).toggleClass($link.data('toggle-class'));
          }
          if ($link.data('move-target') && $link.data('move-id')) {
            $($link.data('move-target')).appendTo($link.data('move-id'));

            if ($($link.data('container-items')).length) {
              $($link.data('container-id')).show();
            } else {
              $($link.data('container-id')).hide();
            }
          }
        } else {
          toaster(data.error.message, 'error');
        }
      });
  }
}
