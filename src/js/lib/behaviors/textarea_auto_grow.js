import $ from 'jquery';

$(() => {
  $(document).on('input keydown', 'textarea:not(.ignore-auto-grow)', (e) => {
    const $textarea = $(e.currentTarget);
    setTimeout(() => {
      $textarea.css('height', 'auto');
      $textarea.css('height', $textarea.get(0).scrollHeight + 'px');
    }, 0);
  });

  for (let textarea of $('textarea:not(.ignore-auto-grow)')) {
    $(textarea).trigger('keydown');
  }
});
