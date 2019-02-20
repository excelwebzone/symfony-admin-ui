import $ from 'jquery';
import _ from 'underscore';
import uuidv4 from 'uuid/v4';

export default class TextEditor {
  constructor(selectorEl) {
    this.initDomElements(selectorEl);
    this.bindEvents();
  }

  initDomElements(selectorEl) {
    this.$selector = $(selectorEl);
    this.$textEditor = this.$selector.closest('.text-editor');
    this.$quickInsertContainer = this.$textEditor.find('.quick-insert-container');

    this.id = this.id = uuidv4();
    this.value = this.$selector.val();

    this.$selector
      .on('froalaEditor.initialized', (e, editor) => {
        this.editor = editor;
      })
      .froalaEditor({ id: this.id });

    if (this.$selector.is(':disabled')) {
      this.editor.edit.off();
    }

    this.editor.popups.create('link.insert', this.createLinkPopup());
  }

  bindEvents() {
    this.$selector.on('content-changed', (e) => this.editor.html.set($(e.currentTarget).val()));
    this.$selector.on('froalaEditor.contentChanged', _.debounce((e, editor) => this.onContentChanged(editor), 1300));

    if (this.$quickInsertContainer.length) {
      this.$selector.on('froalaEditor.click', (e, editor, clickEvent) => this.onClick(e, editor, clickEvent));
      this.$selector.on('froalaEditor.focus', (e, editor) => this.onFocus(editor));
      this.$selector.on('froalaEditor.blur', (e, editor) => this.onBlur(editor));
      this.$selector.on('froalaEditor.keyup', (e, editor, keydownEvent) => this.repositionQuickInsert(editor));
      this.$selector.on('froalaEditor.mousedown', (e, editor, mousedownEvent) => this.onMousedown(e));
      this.$quickInsertContainer.on('click', '.quick-insert-container-button', () => this.toggleQuickInsert());

      $(document).on('click', (e) => {
        if ($(e.target).closest('.text-editor').length === 0) {
          this.hideQuickInsert();
        }
      });

      this.$quickInsertContainer.on('click', '.js-option-item-merge-field', (e) => this.embedMergeField(e));
      this.$quickInsertContainer.on('click', '.js-option-item-merge-link', (e) => this.embedMergeLink(e));
      this.$quickInsertContainer.on('click', '.js-option-item-merge-asset', (e) => this.embedMergeAsset(e));
      this.$quickInsertContainer.on('click', '.js-option-item-merge-letter-tag', (e) => this.embedMergeLetterTag(e));
    }

    this.$textEditor.find('.js-file-chooser').on('file-uploaded', (e, data) => this.embedUploadedFile(data));
  }

  createLinkPopup() {
    return {
      buttons: `<div class="fr-buttons fr-inline-buttons">${this.editor.button.buildList(['linkBack'])}</div>`,
      input_layer: `
        <div class="fr-separator fr-vs" role="separator" aria-orientation="vertical"></div>
          <div class="fr-link-insert-layer fr-layer fr-active" id="fr-link-insert-layer-${this.id}">
            <div class="fr-input-line">
              <input id="fr-link-insert-layer-url-${this.id}" name="href" type="text" class="fr-link-attr" placeholder="URL" tabIndex="0" />
              <div class="fr-separator fr-vs" role="separator" aria-orientation="vertical"></div>
              <button class="fr-command fr-btn fr-submit" title="Done" role="button" data-cmd="linkInsert" href="#" tabIndex="1" type="button">
                <i class="zmdi zmdi-check"></i>
                <span class="fr-sr-only">Done</span>
              </button>
            </div>
          </div>
        `
    };
  }

  insertHTML(snippet) {
    const html = this.editor.html.get();
    if (html && html.toLowerCase() !== '<br>') {
      this.restoreSelection();
      this.editor.html.insert(snippet);
    } else {
      this.editor.html.set(snippet);
      this.editor.selection.setAtEnd(this.editor.$el[0]);
      this.restoreSelection();
    }

    this.editor.undo.saveStep();
  }

  embedUploadedFile(data) {
    if (data.mimetype.substring(0, 6) === 'image/') {
      this.insertHTML(`<img src="${data.url}" style="max-width: 300px" />`);
    } else if (data.mimetype.substring(0, 6) === 'video/') {
      this.insertHTML(`<video src="${data.url}" style="max-width: 300px" controls></video>`);
    } else {
      this.insertHTML(`<a href="${data.url}">${data.filename.substring(data.filename.lastIndexOf('/') + 1)}</a>`);
    }
  }

  embedMergeField(e) {
    const $option = $(e.currentTarget);
    const snippet = `<span class="text-editor-merge-field-container"><span class="text-editor-merge-field is-recipient" data-name="${$option.data('key')}" contenteditable="false"># ${$option.data('key')}</span></span>`;
    this.insertHTML(snippet);
  }

  embedMergeLink(e) {
    const $option = $(e.currentTarget);
    const snippet = `<a href="${$option.data('url')}" target="_blank">${$option.text().trim()}</a>`;
    this.insertHTML(snippet);
  }

  embedMergeAsset(e) {
    const $option = $(e.currentTarget);
    let snippet = `<a href="${$option.data('url')}" target="_blank">${$option.text().trim()}</a>`;

    if ($option.data('is-image')) {
      snippet = `<img src="${$option.data('url')}" style="max-width: 300px" />`;
    } else if ($option.data('is-video')) {
      snippet = `<video src="${$option.data('url')}" style="max-width: 300px" controls></video>`;
    }

    this.insertHTML(snippet);
  }

  embedMergeLetterTag(e) {
    const $option = $(e.currentTarget);
    const id = Math.random().toString(36).substr(2, 9);
    let snippet;

    switch ($option.data('tag')) {
      case 'page_break':
        snippet = '<div class="must-break" />';

        break;

      case 'signature':
        snippet = `<table class="table table-signature center">
<tbody>
<tr>
<td class="title" colspan="4"><strong>AGREED AND ACCEPTED BY</strong></td>
</tr>
<tr>
<td><i class="bookmark">&nbsp;</i></td>
<td class="border"><div class="signature-pad-link" data-id="${id}" data-placeholder="Sign Here" contenteditable="false">Sign Here</div></td>
<td></td>
<td class="border"><div class="text-editor-merge-field-container"><span class="text-editor-merge-field is-recipient" data-id="date" contenteditable="false"># date</span></span></td>
</tr>
<tr>
<td></td>
<td>Client Signature</td>
<td></td>
<td>Date</td>
<tr>
</tbody>
</table>`;

        break;

      case 'initials':
        snippet = `<table class="table table-signature small right">
<tbody>
<tr>
<td class="border"><div class="signature-pad-link" data-id="${id}" data-placeholder="Enter Initials" contenteditable="false">Enter Initials</div></td>
</tr>
<tr>
<td>Initials</td>
<tr>
</tbody>
</table>`;

        break;
    }

    if (snippet) {
      this.insertHTML(`<br/>${snippet}<br/>`);
    }
  }

  onContentChanged(editor) {
    if (this.value !== editor.html.get()) {
      this.value = editor.html.get();
      this.$selector.val(this.value).trigger('change');
    }
  }

  onClick(e, editor, clickEvent) {
    this.repositionQuickInsert(editor);

    if ($(clickEvent.target).hasClass('text-editor-merge-field')) {
      e.preventDefault();
    }
  }

  onFocus(editor) {
    this.showQuickInsert(editor);
    editor.selection.restore();
  }

  onBlur(editor) {
    this.hideQuickInsert();
    this.onContentChanged(editor);
    editor.selection.save();
  }

  onMousedown(e) {
    e.preventDefault();
  }

  restoreSelection() {
    this.$textEditor.find('.fr-view').focus();
    this.editor.selection.restore();
  }

  showQuickInsert(editor) {
    this.$quickInsertContainer.addClass('is-showing').removeClass('is-open open-animate-done');
    this.repositionQuickInsert(editor);
  }

  hideQuickInsert() {
    this.$quickInsertContainer.removeClass('is-showing is-open open-animate-done');
  }

  toggleQuickInsert() {
    this.$quickInsertContainer.addClass('is-showing');
    this.$quickInsertContainer.toggleClass('is-open open-animate-done');
  }

  repositionQuickInsert(editor) {
    const frameRect = this.$textEditor.get(0).getBoundingClientRect();

    let top = this.getCurrentCursorPos(editor.selection.get()).top - frameRect.top;
    top = Math.max(0, Math.min(top, frameRect.height));

    this.$quickInsertContainer.css('top', top);
  }

  getCurrentCursorPos(e) {
    let position = {
      top: 0,
      left: 0
    };

    if (e.rangeCount > 0) {
      const range = e.getRangeAt(0).cloneRange();
      range.collapse(!0);
      position = this.getPosition(range);
    }

    return position;
  }

  getPosition(range) {
    let position = {
      top: 0,
      left: 0
    };

    if (range.getBoundingClientRect && (position = range.getBoundingClientRect()).left === 0 && position.top === 0) {
      const spanEl = document.createElement('span');

      if (spanEl.getBoundingClientRect) {
        spanEl.appendChild(document.createTextNode('â€‹')); // INVISIBLE_UNICODE
        range.insertNode(spanEl);
        position = spanEl.getBoundingClientRect();

        const parentNode = spanEl.parentNode;
        parentNode.removeChild(spanEl);
        parentNode.normalize();
      }
    }

    return position;
  }
}
