import $ from 'jquery';

import 'froala-editor';
import 'froala-editor/js/plugins/align.min.js';
import 'froala-editor/js/plugins/link.min.js';
import 'froala-editor/js/plugins/lists.min.js';
import 'froala-editor/js/plugins/paragraph_format.min.js';

$.FroalaEditor.DEFAULTS = $.extend($.FroalaEditor.DEFAULTS, {
  theme: 'ef',
  charCounterCount: false,
  toolbarButtonsMD: null,
  toolbarButtonsSM: null,
  toolbarButtonsXS: null,
  toolbarInline: true,
  toolbarButtons: [
    'bold', 'italic', 'underline', 'strikeThrough', 'clearFormatting', '|',
    'paragraphFormat', 'align', 'formatOL', 'formatUL', '|',
    'insertLink'
  ],
  linkList: [],
  linkMultipleStyles: false,
  linkText: false,
  linkAlwaysBlank: true,
  linkEditButtons: ['linkOpen', '|', 'linkEdit', 'linkRemove'],
  enter: $.FroalaEditor.ENTER_BR,
  heightMin: 150
});

$.FroalaEditor.ICON_DEFAULT_TEMPLATE = 'material_design';
$.FroalaEditor.DefineIconTemplate('material_design', '<i class="zmdi zmdi-[NAME]"></i>');

const icons = {
  bold: 'format-bold',
  italic: 'format-italic',
  underline: 'format-underlined',
  insertLink: 'link',
  strikeThrough: 'format-strikethrough',
  clearFormatting: 'format-clear',
  paragraphFormat: 'format-size',
  align: 'format-align-left',
  'align-left': 'format-align-left',
  'align-right': 'format-align-right',
  'align-center': 'format-align-center',
  'align-justify': 'format-align-justify',
  formatUL: 'format-list-bulleted',
  formatOL: 'format-list-numbered',
  linkBack: 'arrow-back',
  linkOpen: 'open-in-new',
  linkEdit: 'edit',
  linkRemove: 'minus-circle-outline',
  linkInsert: 'done'
};
for (const icon in icons) {
  $.FroalaEditor.DefineIcon(icon, {
    NAME: icons[icon],
    template: 'material_design'
  });
}

$.FroalaEditor.RegisterCommand('linkInsert', {
  focus: false,
  refreshAfterCallback: false,
  callback() {
    this.link.insertCallback();
  },
  refresh() {}
});
