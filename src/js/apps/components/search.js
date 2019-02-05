import $ from 'jquery';
import _ from 'underscore';
import axios from '../../lib/utils/axios_utils';

const SEARCH_HINT = `
  <div class="global-search-typeahead-hint">
    Press Enter to Search
  </div>
`;

const SEARCH_LOADING = `
  <div class="global-search-typeahead-empty-state">
    <div class="global-search-typeahead-loading-spinner">
      <div class="circle-spinner"></div>
    </div>
  </div>
`;

const SEARCH_EMPTY = `
  <div class="global-search-typeahead-empty-state">
    <div class="global-search-typeahead-empty-state-title pb-1">No Results Found</div>
    <p class="global-search-typeahead-empty-state-text pb-0">
      Try narrowing your search by using the filters on the stones page.
    </p>
  </div>
`;

const SEARCH_RESULT = (keyword, redirect) => `
  <div class="option-list">
    <ul>
      <li class="option-list-item option-list-item-detailed" onclick="location.href='${redirect.replace('__KEYWORD__', keyword)}'">
        <div class="profile-image-component option-list-item-profile-image is-empty" style="background-color:transparent;color:#888">
          <div class="profile-image-component-icon">
            <i class="zmdi zmdi-search"></i>
          </div>
        </div>
        <div class="option-list-item-title" style="padding-top:8px" >
          See all results for "${keyword}"
        </div>
      </li>
    </ul>
  </div>
`;

class Search {
  constructor() {
    this.initDomElements();
    this.bindEvents();
  }

  initDomElements() {
    this.$container = $('.typeahead-global-search');
    this.$options = $('.typeahead-options');
    this.$inputField = $('input.global-search-typeahead-text-field');
  }

  bindEvents() {
    this.$inputField.on('keydown', _.debounce(() => this.getData(), 1300));
    this.$inputField.on('click', () => this.getData());

    // click outside to close
    $(document).on('mouseup', (e) => {
      if (!this.$container.is(e.target) && this.$container.has(e.target).length === 0) {
        this.reset();
      }
    });
  }

  reset() {
    this.$container
      .removeClass('is-expanded')
      .addClass('is-empty');

    this.$container.find('.global-search-typeahead-hint').remove();
    this.$options.html('');
  }

  getData() {
    this.reset();
    if (0 === this.$inputField.val().length) {
      return;
    }

    this.$container
      .removeClass('is-empty')
      .addClass('is-expanded');

    this.$container.find('.typeahead-header').append(SEARCH_HINT);
    this.$options.html(SEARCH_LOADING);

    axios.get(this.$container.data('endpoint'), {
      params: {
        filters: {
          search: this.$inputField.val()
        }
      }
    })
      .then(({ data }) => {
        this.$options.html('');

        if (0 === data.count) {
          this.$options.html(SEARCH_EMPTY);
        } else {
          this.$options.append(SEARCH_RESULT(this.$inputField.val(), this.$container.data('redirect')));
          this.$options.find('.option-list>ul').append(data.html);
        }
      });
  }
}

export default new Search();
