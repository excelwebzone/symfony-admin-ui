import $ from 'jquery';
import emojiConvertor from '../../lib/utils/emoji_convertor';
import axios from '../../lib/utils/axios_utils';
import { objectToFormData } from '../../lib/utils/object_formdata_utils';

export default class Reactions {
  constructor() {
    this.bindEvents();
  }

  bindEvents() {
    $(document).on('data:loaded', '.activity-log-list', (e, data) => this.dataLoaded(e, data));
    $(document).on('click', '.activity-item-reactions-user.see-all', (e) => this.seeAll(e));
    $(document).on('click', '.activity-item-reactions-new-reaction', (e) => this.showOptions(e));
    $(document).on('click', '.activity-item-reactions-emoji', (e) => this.onClick(e));

    $(document).on('click', '*', (e) => {
      const $target = $(e.target);

      if (!$target.hasClass('activity-item-reactions-new-reaction')
        && $target.closest('.activity-item-reactions-new-reaction').length === 0
        && $target.closest('.activity-item-reactions-choose-reaction').length === 0
      ) {
        this.hideOptions();
      }
    });
  }

  dataLoaded(e, data) {
    const $target = $(e.currentTarget);

    for (let comment of $target.find('.activity-item:not(.reactions-loaded)')) {
      const $comment = $(comment);
      $comment.addClass('reactions-loaded');

      for (let button of $comment.find('.activity-item-reactions-emoji')) {
        $(button).prepend(emojiConvertor.replace_colons(`:${$(button).data('value')}:`));
      }
    }
  }

  seeAll(e) {
    const $target = $(e.currentTarget);
    $target.fadeOut('slow', () => {
      $target.closest('.activity-item-reactions-users')
        .find('.activity-item-reactions-user')
        .removeClass('hide');

      $target.remove();
    });
  }

  showOptions(e) {
    const $target = $(e.currentTarget);
    const $item = $target.closest('.activity-item');
    const $dropdown = $item.find('.activity-item-reactions-choose-reaction');

    this.hideOptions();

    if ($target.closest('.activity-item-quick-actions').length) {
      $dropdown.addClass('activity-item-reactions-choose-reaction-open')
        .removeClass('activity-item-reactions-choose-reaction-opposite');
    } else {
      $dropdown.addClass('activity-item-reactions-choose-reaction-open activity-item-reactions-choose-reaction-opposite');
    }
  }

  hideOptions(e) {
    $('.activity-item-reactions-choose-reaction')
      .removeClass('activity-item-reactions-choose-reaction-open activity-item-reactions-choose-reaction-opposite');
  }

  onClick(e) {
    const $target = $(e.currentTarget);
    const $item = $target.closest('.activity-item');
    const $dropdown = $item.find('.activity-item-reactions-choose-reaction');
    const $container = $item.find('.activity-item-reactions');
    const $list = $container.find('.activity-item-reactions-list-reactions');

    axios.post($container.data('reaction-endpoint'), objectToFormData({ icon: $target.data('value') }))
      .then(({ data }) => {
        if (data.ok) {
          this.hideOptions();

          let $button = $list.find(`.activity-item-reactions-emoji[data-value="${$target.data('value')}"]`);
          if ($button.length) {
            $button.parent().popover('dispose');
            $button.parent().replaceWith(data.html);
          } else {
            $list.append(data.html);
          }

          const emoji = emojiConvertor.replace_colons(`:${$target.data('value')}:`);

          $button = $list.find(`.activity-item-reactions-emoji[data-value="${$target.data('value')}"]`);
          $button.text(emoji);

          const $counter = $button.next('.js-activity-item-reaction-counter');
          if (parseInt(0 + $counter.text()) === 0) {
            $counter.parent().fadeOut('slow', () => {
              $counter.parent()
                .popover('dispose')
                .remove();
            });
          }

          if (data.action === 'remove') {
            $dropdown.find(`.activity-item-reactions-emoji[data-value="${$target.data('value')}"]`).removeClass('is-active');
          } else {
            $dropdown.find(`.activity-item-reactions-emoji[data-value="${$target.data('value')}"]`).addClass('is-active');
          }

          if ($dropdown.find('.activity-item-reactions-emoji.is-active').length) {
            $list.find('.activity-item-reactions-new-reaction').addClass('is-active');
          } else {
            $list.find('.activity-item-reactions-new-reaction').removeClass('is-active');
          }
        }
      });
  }
};
