import $ from 'jquery';

export default class Rating {
  constructor(containerEl) {
    this.$container = $(containerEl);

    this.bindEvents();
  }

  bindEvents() {
    this.$container.on('click', '.star', this.labelWasClicked);
    this.$container.on('mouseover', this.turnToStar);
    this.$container.on('mouseout', this.turnStarBack);
    this.$container.on('set:readonly', this.markAsReadonly);
  }

  markAsReadonly() {
    $(this)
      .addClass('is-readonly')
      .trigger('mouseout');

    // unbind
    $(this).off('click');
    $(this).off('mouseover');
    $(this).off('mouseout');
  }

  labelWasClicked(e) {
    const input = $(this).siblings().filter('input');
    if (input.attr('disabled')) {
      return;
    }
    input.val(input.val() !== $(this).attr('data-value') ? $(this).attr('data-value') : 0)
      .trigger('change');
  }

  turnToStar() {
    if ($(this).find('input').attr('disabled')) {
      return;
    }
    const labels = $(this).find('div');
    labels.removeClass('is-selected');
  }

  turnStarBack() {
    const rating = parseInt($(this).find('input').val());
    const selectedStar = $(this).children().filter('#rating_star_' + rating);
    const prevLabels = $(selectedStar).nextAll();
    prevLabels.addClass('is-selected');
    selectedStar.addClass('is-selected');
  }
}
