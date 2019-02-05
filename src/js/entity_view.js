import $ from 'jquery';
import _ from 'underscore';
import toaster from './lib/utils/toaster';
import axios from './lib/utils/axios_utils';
import { modifiedValues } from './lib/utils/modified_values';
import bp from './breakpoints';

export default class EntityView {
  constructor() {
    this.bindEvents();
  }

  bindEvents() {
    $(document).on('click', '.js-print-item', (e) => this.printItem(e));
    $(document).on('click', '.js-action-item', (e) => this.actionItem(e));
    $(document).on('click', '.js-toggle-item', (e) => this.toggleItem(e));
    $(document).on('click', '.js-unread-item', (e) => this.unreadItem(e));
    $(document).on('click', '.js-follow-item', (e) => this.toggleFollow(e));
    $(document).on('click', '.js-complete-item', (e) => this.toggleComplete(e));
    $(document).on('modal:shown', '.js-delete-item', (e, modal) => this.deleteModal(e, modal));
    $(document).on('modal:shown', '.js-delete-related-item', (e, modal) => this.deleteRelatedModal(e, modal));
    $(document).on('modal:shown', '.js-new-entity-related', (e, modal) => this.newEntityRealted(e, modal));

    $(window).on('resize.entityview', () => this.optimizeView());
    $('.profile-right,.profile-center').on('block:loaded', () => this.optimizeView());
  }

  optimizeView() {
    const $profileRight = $('.profile-right');
    const $profileCenter = $('.profile-center');

    if ($profileRight.length && $profileCenter.length) {
      let bootstrapBreakpoint = bp.getBreakpointSize();
      if (bootstrapBreakpoint === 'xs') {
        $profileRight.find('.entity-related').appendTo($($profileRight.data('target')));
        $profileCenter.find('.entity-activity').appendTo($($profileCenter.data('target')));
      } else {
        $($profileRight.data('target')).find('.entity-related').appendTo($profileRight);
        $($profileCenter.data('target')).find('.entity-activity').appendTo($profileCenter);
      }
    }
  }

  printItem(e) {
    axios.post($(e.currentTarget).data('endpoint'))
      .then(({ data }) => {
        if (data.message) {
          toaster(data.message, 'default', data.actionConfig);
        }
      });
  }

  actionItem(e) {
    const $target = $(e.currentTarget);
    const $drawer = $target.closest('.drawer-frame');

    const _post = () => {
      axios.post($target.data('endpoint'))
        .then(({ data }) => {
          if (data.message) {
            toaster(data.message, 'default', data.actionConfig);
          } else if (data.error) {
            toaster(data.error.message, 'error', data.actionConfig);
          }

          if (data.fields) {
            // in page or drawer header
            for (let [field, value] of Object.entries(data.fields)) {
              modifiedValues($drawer, field, value, $($target.data('container') || 'body'));
            }
          }
        });
    };

    const popover = $target.data('popover');
    if (!popover) {
      return _post();
    }

    $target.popover({
      placement: popover.placement || 'top',
      title: popover.title,
      html: popover.html,
      content: popover.content
    });
    $target.popover('show');

    $($target.data('bs.popover').tip).find('button').on('click', (e) => {
      if ($(e.currentTarget).hasClass('popover-submit')) {
        _post()
      }

      $target.popover('hide');
    });

    e.stopPropagation();
  }

  toggleItem(e) {
    const $button = $(e.currentTarget);
    const $drawer = $button.closest('.drawer-frame');

    axios.post($button.data('endpoint'))
      .then(({ data }) => {
        $button.toggleClass('is-active');

        if (data.fields) {
          // in page or drawer header
          for (let [field, value] of Object.entries(data.fields)) {
            modifiedValues($drawer, field, value, $($button.data('container') || 'body'));
          }
        }
      });
  }

  unreadItem(e) {
    const $button = $(e.currentTarget);
    axios.post($button.data('endpoint'))
      .then(({ data }) => {
        const $drawer = $button.closest('.drawer-frame');
        if ($drawer.length) {
          const $row = $(`.js-entity-drawer[data-id="${$drawer.data('id')}"]`);
          if ($row.length) {
            $row.toggleClass('is-unread');
          }
        }
      });
  }

  toggleFollow(e) {
    const $button = $(e.currentTarget);
    const $icon = $button.find('i');

    axios.post($button.data('endpoint'))
      .then(({ data }) => {
        $icon
          .toggleClass('zmdi-star-outline')
          .toggleClass('zmdi-star');

        const $drawer = $button.closest('.drawer-frame');
        if ($drawer.length) {
          const $row = $(`.js-entity-drawer[data-id="${$drawer.data('id')}"]`);
          if ($row.length) {
            $row.data('is-follow', !$row.data('is-follow'));
            $row.find('.js-follow-item').prop('checked', !$row.find('.js-follow-item').prop('checked'));
          }
        }

        const $emberRow = $button.closest('.js-entity-drawer');
        if ($emberRow.length) {
          $emberRow.data('is-follow', !$emberRow.data('is-follow'));

          const $drawer = $(`.drawer-frame[data-id="${$emberRow.data('id')}"]`);
          if ($drawer.length) {
            $drawer.find('.js-follow-item>i')
              .toggleClass('zmdi-star-outline')
              .toggleClass('zmdi-star');
          }
        }
      });
  }

  toggleComplete(e) {
    const $button = $(e.currentTarget);

    axios.post($button.data('endpoint'))
      .then(({ data }) => {
        $button.closest('.task-check-box-container').toggleClass('is-completed');

        const $entitySummary = $button.closest('.entity-summary-task');
        if ($entitySummary.length) {
          $entitySummary.toggleClass('is-complete');

          return;
        }

        const $drawer = $button.closest('.drawer-frame');
        if ($drawer.length) {
          $drawer.toggleClass('is-complete');

          const $emberRowLeft = $(`.js-entity-drawer[data-id="${$drawer.data('id')}"]`);
          if ($emberRowLeft.length) {
            $emberRowLeft.data('is-complete', !$emberRowLeft.data('is-complete'));
            $emberRowLeft.find('.task-check-box-container').toggleClass('is-completed');
            $emberRowLeft.find('.js-complete-item').prop('checked', !$emberRowLeft.find('.js-complete-item').prop('checked'));
            $emberRowLeft.find('.table-cell-name').toggleClass('is-completed');

            const $emberRowRight = $emberRowLeft.closest('.list-page-table').find('.ember-table-body-container .ember-table-right-table-block .ember-table-table-row').eq($emberRowLeft.index());
            $emberRowRight.find('.table-cell-name').toggleClass('is-completed');
          }
        }

        const $emberRowLeft = $button.closest('.js-entity-drawer');
        if ($emberRowLeft.length) {
          $emberRowLeft.data('is-complete', !$emberRowLeft.data('is-complete'));
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
      });
  }

  deleteModal(e, modal) {
    const reload = $(e.currentTarget).data('reload') || false;
    const redirect = $(e.currentTarget).data('redirect') || false;
    const $drawer = $(e.currentTarget).closest('.drawer-frame') || null;

    $(modal).on('modal:hidden', (e, data) => {
      $(modal).off('modal:hidden');

      if (data.error) {
        return;
      }

      if (reload) {
        if ($drawer.length) {
          $drawer.find('.js-drawer-close').click();
        }

        $('.list-page-table').trigger('load-filters');
        return;
      }

      if (redirect) {
        location.href = redirect;
        return;
      }
    });
  }

  deleteRelatedModal(e, modal) {
    const $target = $(e.currentTarget);
    const $drawer = $target.closest('.drawer-frame');

    $(modal).on('modal:hidden', (e, data) => {
      $(modal).off('modal:hidden');

      if (data.error) {
        return;
      }

      if (data.redirect) {
        if ($('.list-page-table').length) {
          if ($drawer.length) {
            $drawer.find('.js-drawer-close').click();
          }

          $('.list-page-table').trigger('load-filters');
          return;
        }

        location.href = data.redirect;
      }

      if ($target.data('trigger')) {
        $target.trigger($target.data('trigger'), data);
      }

      const $container = $target.closest('.entity-association-group').find('.js-entity-related-container');
      const $counter = $target.closest('.entity-association-group').find('.entity-association-group-title>span');

      // remove row
      $target.closest('.entity-summary').remove();

      // increase total
      const total = parseInt(0+$counter.text())-1;
      $counter.text(total);

      if (total === 0) {
        $container.find('.entity-association-group-empty-row').show();
      }
      if (total < 2) {
        $container.find('.entity-association-group-footer-link').hide();
      }

      if (data.fields) {
        // in page or drawer header
        for (let [field, value] of Object.entries(data.fields)) {
          modifiedValues($drawer, field, value, $($target.data('container') || 'body'));
        }
      }
    });
  }

  newEntityRealted(e, modal) {
    const $target = $(e.currentTarget);
    const template = $target.data('template');

    $(modal).on('modal:hidden', (e, data) => {
      $(modal).off('modal:hidden');

      const $container = $target.closest('.entity-association-group').find('.js-entity-related-container');
      const $counter = $target.closest('.entity-association-group').find('.entity-association-group-title>span');

      if ($target.data('reset')) {
        $container.find('.entity-summary').remove();
        $counter.text(0);
      }

      // hide empty row
      $container.find('.entity-association-group-empty-row').hide();

      // increase total
      const total = parseInt(0+$counter.text())+(data.items ? data.items.length : 1);
      $counter.text(total);

      if ($target.data('reset') || $target.data('unlimited') || total <= 2) {
        $container.prepend(_.template($(template).html())(data));
      }
      if (total === 2) {
        $container.find('.entity-association-group-footer-link').show();
      }

      // in page or drawer header
      const $drawer = $target.closest('.drawer-frame');
      for (let [field, value] of Object.entries(data.fields)) {
        modifiedValues($drawer, field, value, $($target.data('container') || 'body'));
      }
    });
  }
};
