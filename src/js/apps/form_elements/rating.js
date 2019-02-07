import $ from 'jquery';

export default class Rating {
  constructor(containerEl) {
    this.$container = containerEl ? $(containerEl) : $('body');

    this.bindEvents();
  }

  bindEvents() {
    this.$container.on('click', '.star', this.labelWasClicked);
    this.$container.on('mouseover', '.rating-well', this.turnToStar);
    this.$container.on('mouseout', '.rating-well', this.turnStarBack);
  }

  labelWasClicked(e) {
    const input = $(this).siblings().filter('input');
    if (input.attr('disabled')) {
      return;
    }
    input.val($(this).attr('data-value'))
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
