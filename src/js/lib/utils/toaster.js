import _ from 'underscore';

const hideToaster = (toasterEl, fadeTransition = true) => {
  if (fadeTransition) {
    Object.assign(toasterEl.style, {
      transition: 'opacity .3s',
      opacity: '0'
    });
  }

  toasterEl.addEventListener('transitionend', () => {
    toasterEl.remove();
  }, {
    once: true,
    passive: true
  });

  if (!fadeTransition) toasterEl.dispatchEvent(new Event('transitionend'));
};

const createAction = config => `
  <a
    href="${config.href || 'javascript:void(0)'}"
    class="btn btn-flat-default ${config.class || ''}"
    target="${config.target || '_self'}"
    ${config.href ? '' : 'role="button"'}
    ${config.data || ''}
  >
    ${_.escape(config.title)}
  </a>
`;

const createToasterEl = (message, type, closeButton) => `
  <div class="toaster toaster-${type}">
    <div class="toaster-toast-wrapper">
      <div class="toast is-open">
        <div class="toast-message">
          ${_.escape(message)}
        </div>
        <div class="toast-action">
          ${closeButton ? '<i class="toast-close ledger-icons ledger-icon-close"></i>' : ''}
        </div>
      </div>
    </div>
  </div>
`;

const removeToasterClickListener = (toasterEl, fadeTransition) => {
  toasterEl.addEventListener('click', (e) => {
    if (e.target.tagName.toLowerCase() === 'a') {
      return;
    }

    hideToaster(toasterEl, fadeTransition);
  });
};

/*
 *  Toaster banner supports different types of Toaster configurations
 *  along with ability to provide actionConfig which can be used to show
 *  additional action or link on banner next to message
 *
 *  @param {String} message           Toast message text
 *  @param {String} type              Type of Toaster, it can be `error` or default` (default)
 *  @param {Object} actionConfig      Map of config to show action on banner
 *    @param {String} href            URL to which action config should point to (default: '#')
 *    @param {String} title           Title of action
 *    @param {String} target          Target of action
 *  @param {Boolean} fadeTransition   Boolean to determine whether to fade the banne out
 */
const createToaster = function createToaster(
  message,
  type = 'default',
  actionConfig = null,
  fadeTransition = true
) {
  // auto open in new window
  if (actionConfig && actionConfig.open) {
    if (window.open(actionConfig.href)) {
      return;
    }
  }

  const toasterContainer = document.querySelector('.toasters');

  if (!toasterContainer) return null;

  toasterContainer.innerHTML = createToasterEl(message, type, actionConfig);

  const toasterEl = toasterContainer.querySelector(`.toaster-${type}`);
  removeToasterClickListener(toasterEl, fadeTransition);

  if (actionConfig) {
    const toastActionEl = toasterEl.querySelector('.toast-action');

    if (!_.isArray(actionConfig)) {
      actionConfig = [actionConfig];
    }

    for (let config of actionConfig.slice(0).reverse()) {
      toastActionEl.innerHTML = createAction(config) + toastActionEl.innerHTML;
    }
  } else {
    setTimeout(() => toasterEl.click(), 2e3);
  }

  toasterContainer.style.display = 'block';

  return toasterContainer;
};

export {
  createToaster as default,
  createToasterEl,
  createAction,
  hideToaster,
  removeToasterClickListener
};
window.Toaster = createToaster;
