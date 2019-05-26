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
    $(document).on('modal:shown', '.js-new-related-item', (e, modal) => this.newRelatedItem(e, modal));
    $(document).on('click', '.js-related-toggle-button', (e) => this.toggleRelatedButton(e));
    $(document).on('click', '.js-related-add-row', (e) => this.showAddRelatedRow(e));
    $(document).on('click', '.js-related-select-dropdown .option-list-item:not(.option-list-item-action-button)', (e) => this.selectRelatedItem(e));
    $(document).on('dropdown:autocomplete', '.js-related-select-dropdown', (e) => this.addCreateLinkToSelectRelatedItems(e));
    $(document).on('dropdown:related-selected', '.js-related-select-dropdown', (e) => this.addSelectedRelatedItem(e));

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

  showPopover($button, _post) {
    const popover = $button.data('popover');
    if (!popover) {
      return _post();
    }

    if ($button.is(':hidden')) {
      $button = $button.parent();
    }

    $button.popover('dispose');
    $button.popover({
      placement: popover.placement || 'top',
      title: popover.title,
      html: popover.html,
      content: popover.content
    });
    $button.popover('show');

    $($button.data('bs.popover').tip).find('.button').on('click', (e) => {
      if ($(e.currentTarget).hasClass('popover-submit')) {
        _post();
      }

      $button.popover('hide');
    });
  }

  printItem(e) {
    const $button = $(e.currentTarget);

    const _post = () => {
      axios.post($button.data('endpoint'))
        .then(({ data }) => {
          if (data.message) {
            toaster(data.message, 'default', data.actionConfig);
          }
        });
    };

    this.showPopover($button, _post);
  }

  actionItem(e) {
    const $button = $(e.currentTarget);
    const $drawer = $button.closest('.drawer-frame');

    const _post = () => {
      axios.post($button.data('endpoint'))
        .then(({ data }) => {
          if (data.message) {
            toaster(data.message, 'default', data.actionConfig);
          } else if (data.error) {
            toaster(data.error.message, 'error', data.actionConfig);
          }

          if (data.fields) {
            // in page or drawer header
            for (let [field, value] of Object.entries(data.fields)) {
              modifiedValues($drawer, field, value, $($button.data('container') || 'body'));
            }
          }

          $button.trigger('item:action');
        });
    };

    this.showPopover($button, _post);
  }

  toggleItem(e) {
    const $button = $(e.currentTarget);
    const $drawer = $button.closest('.drawer-frame');

    const _post = () => {
      axios.post($button.data('endpoint'))
        .then(({ data }) => {
          $button.toggleClass('is-active');

          if (data.message) {
            toaster(data.message, 'default', data.actionConfig);
          } else if (data.error) {
            toaster(data.error.message, 'error', data.actionConfig);
          }

          if (data.fields) {
            // in page or drawer header
            for (let [field, value] of Object.entries(data.fields)) {
              modifiedValues($drawer, field, value, $($button.data('container') || 'body'));
            }
          }

          $button.trigger('item:toggle');
        });
    };

    this.showPopover($button, _post);
  }

  unreadItem(e) {
    const $button = $(e.currentTarget);

    const _post = () => {
      axios.post($button.data('endpoint'))
        .then(({ data }) => {
          if (data.message) {
            toaster(data.message, 'default', data.actionConfig);
          } else if (data.error) {
            toaster(data.error.message, 'error', data.actionConfig);
          }

          const $drawer = $button.closest('.drawer-frame');
          if ($drawer.length) {
            const $row = $(`.js-entity-drawer[data-id="${$drawer.data('id')}"]`);
            if ($row.length) {
              $row.toggleClass('is-unread');
            }
          }

          $button.trigger('item:unread');
        });
    };

    this.showPopover($button, _post);
  }

  toggleFollow(e) {
    const $button = $(e.currentTarget);
    const $icon = $button.find('i');

    const _post = () => {
      axios.post($button.data('endpoint'))
        .then(({ data }) => {
          if (data.message) {
            toaster(data.message, 'default', data.actionConfig);
          } else if (data.error) {
            toaster(data.error.message, 'error', data.actionConfig);
          }

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

          $button.trigger('item:follow');
        });
    };

    this.showPopover($button, _post);
  }

  toggleComplete(e) {
    const $button = $(e.currentTarget);

    const _post = () => {
      axios.post($button.data('endpoint'))
        .then(({ data }) => {
          if (data.message) {
            toaster(data.message, 'default', data.actionConfig);
          } else if (data.error) {
            toaster(data.error.message, 'error', data.actionConfig);
          }

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

          $button.trigger('item:complete');
        });
    };

    this.showPopover($button, _post);
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
      const $addRow = $target.closest('.entity-association-group').find('.entity-association-group-add-row');

      // remove row
      $target.closest('.entity-summary').remove();

      // increase total
      const total = parseInt(0 + $counter.text()) - 1;
      $counter.text(total);

      if (total === 0 && ($addRow.length === 0 || !$addRow.hasClass('is-active'))) {
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

  newRelatedItem(e, modal) {
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
      const total = parseInt(0 + $counter.text()) + (data.items ? data.items.length : 1);
      $counter.text(total);

      if ($target.data('reset') || $target.data('unlimited') || total <= 2) {
        const $addRow = $container.find('.entity-association-group-add-row');
        if ($addRow.length) {
          $addRow.after(_.template($(template).html())(data));
        } else {
          $container.prepend(_.template($(template).html())(data));
        }
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

  toggleRelatedButton(e) {
    if (e.target.tagName.toLowerCase() === 'a'
      || $(e.target).hasClass('js-toggle-ignore')
      || $(e.target).closest('.js-toggle-ignore').length
    ) {
      return;
    }

    const $target = $(e.currentTarget);
    const $addButton = $target.find('.js-related-add-row');
    if (!$target.hasClass('open') && $addButton.length && $addButton.hasClass('is-active')) {
      $addButton.click();
    }
  }

  showAddRelatedRow(e) {
    const $target = $(e.currentTarget);
    const $container = $target.closest('.entity-association-group');
    const $button = $container.find('.quick-add-toggle.js-related-add-row');

    $button.toggleClass('is-active');
    $container.find('.entity-association-group-add-row').toggle();

    if ($container.find('.js-entity-related-container .entity-summary').length === 0) {
      $container.find('.entity-association-group-empty-row').toggle();
    }

    if ($button.hasClass('is-active') && !$container.hasClass('is-expanded')) {
      $container.find('.js-related-toggle-button').click();
    }
  }

  selectRelatedItem(e) {
    const $target = $(e.currentTarget);
    if (!$target.data('json')) {
      return;
    }

    const $container = $target.closest('.entity-association-group').find('.js-entity-related-container');
    const $counter = $target.closest('.entity-association-group').find('.entity-association-group-title>span');
    const $template = $($target.closest('.js-related-select-dropdown').data('template'));

    // hide empty row
    $container.find('.entity-association-group-empty-row').hide();

    // increase total
    const total = parseInt(0 + $counter.text()) + 1;
    $counter.text(total);

    $target.closest('.entity-association-group-add-row')
      .after(_.template($template.html())($target.data('json')));

    $target.closest('.js-related-select-dropdown').trigger('dropdown:related-selected');
  }

  addCreateLinkToSelectRelatedItems(e) {
    const $dropdown = $(e.currentTarget);
    const $options = $dropdown.find('.option-list').find('>ul');

    // remove when not found items
    $options.find('li.option-list-label.option-list-label-empty').remove();

    // add "create new"
    if ($dropdown.data('create-endpoint')) {
      const inputText = $dropdown.find('.dropdown-filter>.input-text').val();

      $options.append(`
        <li class="option-list-item js-new-related-item js-entity-modal"
          data-template="${$dropdown.data('template')}"
          data-endpoint="${$dropdown.data('create-endpoint').replace('__NAME__', inputText)}"
          data-unlimited="true"
        >
          <div class="option-list-label-label">Create "${inputText}"</div>
        </li>
      `);
    }
  }

  addSelectedRelatedItem(e) {
    const $dropdown = $(e.currentTarget);
    const $option = $dropdown.find('.option-list-item.is-selected');
    $option.remove();

    axios.post($dropdown.data('add-endpoint').replace('__ID__', $option.data('value')))
      .then(({ data }) => {
        if (data.error) {
          toaster(data.error.message, 'error');
        }
      });
  }
}
