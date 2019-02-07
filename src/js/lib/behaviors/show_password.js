import $ from 'jquery';

const showPassword = checkbox => {
  const $password = $($(checkbox).data('target'));
  if ($password.attr('type') === 'password') {
    $password.attr('type', 'text');
  } else {
    $password.attr('type', 'password');
  }
};

$(() => {
  $(document).on('click', '.js-show-password', (e) => {
    showPassword(e.currentTarget);
  });

  for (let checkbox of $('.js-show-password')) {
    if ($(checkbox).is(':checked')) {
      showPassword(checkbox);
    }
  }
});
