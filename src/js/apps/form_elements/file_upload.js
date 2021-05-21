import $ from 'jquery';
import _ from 'underscore';
import Dropzone from 'dropzone';
import Cropper from 'cropperjs';
import toaster from '../../lib/utils/toaster';
import axios from '../../lib/utils/axios_utils';

// Disable auto discover for all elements:
Dropzone.autoDiscover = false;

export default class FileUpload {
  constructor(selectorEl) {
    const self = this;
    self.$selector = $(selectorEl);

    self.$selector.find('.js-file-remove').on('click', (e) => this.removeFile(e));

    $('.js-new-file').on('click', (e) => {
      $($(e.currentTarget).data('target')).click();
      e.stopPropagation();
    });

    $('.js-reload-file').on('click', () => {
      self.removeClass('is-file-loaded');
    });

    let options = {
      previewTemplate: '<div style="display:none"></div>',
      init: function() {
        if (self.$selector.data('image-cropper')) {
          this.options.transformFile = (file, done) => {
            self.transformFile(this, file, done);
          };
        }

        this.on('dragover', () => self.addClass('is-dragging'));
        this.on('dragleave', () => self.removeClass('is-dragging'));

        this.on('addedfile', (file) => {
          if (this.options.maxFiles) {
            while (this.files.length > this.options.maxFiles) {
              this.removeFile(this.files[0]);
            }
          }
        });

        this.on('uploadprogress', (file, progress, bytesSent) => {
          self.removeClass('is-dragging');
          self.addClass('is-uploading');

          if (self.$selector.find('.js-progress-text')) {
            // converts a long string of bytes into a readable format e.g KB, MB, GB, TB, YB
            const size = Math.floor(Math.log(bytesSent) / Math.log(1024));
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
            const readableBytes = (bytesSent / Math.pow(1024, size)).toFixed(2) * 1 + ' ' + sizes[size];

            self.$selector.find('.js-progress-text').text(`Progress: ${progress}%, Sent: ${readableBytes}`);
          }
        });

        this.on('sending', (file, xhr, formData) => {
          if (self.$selector.data('params-form')) {
            let fields = $(self.$selector.data('params-form')).serializeArray();
            $.each(fields, function(index, field) {
              formData.append(field.name, field.value);
            });
          }
        });

        this.on('success', (file, json) => {
          json = typeof json === 'string' ? JSON.parse(json) : json;

          if (json.error) {
            self.showErrorMessage(json.error.message);
            return;
          }

          if (json.redirect) {
            window.location.href = json.redirect;
            return;
          }

          const redirect = self.$selector.data('redirect');
          if (redirect) {
            window.location.href = redirect.replace('__FILE__', _.last(json.filename.split('\/')));
            return;
          }

          if (self.$selector.data('update-avatar')) {
            self.$selector.find('img').prop('src', json.filename);

            if (self.$selector.data('update-profile-avatar')) {
              $('.profile-avatar').replaceWith(`
                <div class="profile-image-component profile-image-component-circle is-photo-loaded profile-avatar">
                  <div class="profile-image-component-image">
                    <img src="${json.filename}" />
                  </div>
                </div>
              `);
            }

            if (self.$selector.data('update-datagrid-avatar')) {
              const $row = $(`.js-entity-drawer[data-id="${self.$selector.data('id')}"]`);
              if ($row) {
                $row.data('photo', json.filename);

                $row.find('.table-cell-avatar').html(`
                  <div class="profile-image-component profile-image-component-circle is-photo-loaded">
                    <div class="profile-image-component-image">
                      <img src="${json.filename}" />
                    </div>
                  </div>
                `);
              }
            }
          }

          if (self.$selector.data('filename-field')) {
            self.$selector.closest('form').find(self.$selector.data('filename-field')).val(json.filename);
          }

          if (self.$selector.data('filename-text')) {
            $(self.$selector.data('filename-text')).text(json.filename.split(/[\\/]/).pop());
          }

          if (self.$selector.data('template')) {
            if (self.$selector.data('template-replace')) {
              $(self.$selector.data('target')).html(_.template($(self.$selector.data('template')).html())(json));
            } else {
              $(self.$selector.data('target')).prepend(_.template($(self.$selector.data('template')).html())(json));
            }
          }

          if (self.$selector.data('trigger')) {
            self.$selector.trigger(self.$selector.data('trigger'), [json, file]);
          }

          self.clearIsClasses();
          self.addClass('is-file-loaded');
        });

        this.on('error', (file, message) => {
          self.removeClass('is-dragging');
          self.removeClass('is-uploading');

          self.showErrorMessage(message);
        });
      }
    };

    options.url = self.$selector.data('endpoint');
    options.maxFiles = self.$selector.data('max-files') || 1;
    options.maxFilesize = self.$selector.data('max-filesize') || 5;
    options.timeout = self.$selector.data('timeout') || 3600000;

    // unlimited
    if (options.maxFiles === -1) {
      options.maxFiles = null;
    }

    if (self.$selector.data('accepted-files')) {
      options.acceptedFiles = self.$selector.data('accepted-files');

      if (options.acceptedFiles === 'image/*') {
        options.params = {
          is_photo: 1
        };
      } else {
        options.params = {
          mimetypes_extensions: self.$selector.data('accepted-extensions'),
          mimetypes_types: options.acceptedFiles
        };
      }
    }

    if (self.$selector.data('prefix')) {
      options.params = $.extend({}, options.params, {
        prefix: self.$selector.data('prefix')
      });
    }

    if (self.$selector.data('directory')) {
      options.params = $.extend({}, options.params, {
        directory: self.$selector.data('directory')
      });
    }

    try {
      // handle file uploading
      self.$selector.dropzone(options);
    } catch (e) {}
  }

  clearIsClasses() {
    // removes anything that starts with "is-"
    this.$selector.removeClass((index, css) => {
      return (css.match(/\bis-\S+/g) || []).join(' ');
    });

    if (this.$selector.data('display-output')) {
      $(this.$selector.data('display-output')).html('');
    }
  }

  addClass(className) {
    this.$selector.addClass(className);
  }

  removeClass(className) {
    this.$selector.removeClass(className);
  }

  showErrorMessage(message) {
    this.removeClass('is-uploading');

    toaster(message, 'error');
  }

  removeFile(e) {
    const self = this;

    axios.delete($(e.currentTarget).data('endpoint'))
      .then(({ data }) => {
        if (data.ok) {
          self.clearIsClasses();
          self.addClass('is-empty');

          toaster('File has been removed');

          if (self.$selector.data('update-avatar')) {
            self.$selector.find('img').prop('src', self.$selector.data('default-avatar'));

            if (self.$selector.data('update-profile-avatar')) {
              if (self.$selector.data('default-avatar')) {
                $('.profile-avatar').replaceWith(`
                  <div class="profile-image-component profile-image-component-circle is-photo-loaded profile-avatar">
                    <div class="profile-image-component-image">
                      <img src="${self.$selector.data('default-avatar')}" />
                    </div>
                  </div>
                `);
              }

              // override with initials
              if (self.$selector.data('default-initials')) {
                $('.profile-avatar').replaceWith(`
                  <div class="profile-image-component profile-image-component-circle profile-avatar">
                    <div class="profile-image-component-initials">
                      ${self.$selector.data('default-initials')}
                    </div>
                  </div>
                `);
              }
            }
          }
        } else {
          toaster(data.error.message, 'error');
        }
      });
  }

  transformFile(dz, file, done) {
    if ($('#dropzone-cropper-modal').length) {
      $('#dropzone-cropper-modal').remove();
    }

    // create the image editor modal
    $('body').append(`
      <div class="modal" id="dropzone-cropper-modal">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">Crop Image</div>
            <div class="modal-body p-0">
              <img src="${URL.createObjectURL(file)}" class="mw-100 js-dropzone-cropper-img" />
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-flat-default" data-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary js-dropzone-cropper-crop">Crop</button>
            </div>
            <div class="modal-corner">
              <div class="button-close" data-dismiss="modal">
                <i class="ledger-icons ledger-icon-close"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);

    let croppedFile = false;

    const $modal = $('#dropzone-cropper-modal');
    $modal.modal('show');

    // delete file from Dropzone list when upload was canceled
    $modal.on('hidden.bs.modal', () => {
      if (!croppedFile) {
        dz.removeFile(file);
      }

      // force removal
      $modal.remove();
    });

    $('.js-dropzone-cropper-crop').off('click');
    $('.js-dropzone-cropper-crop').on('click', () => {
      croppedFile = true;

      // get the canvas with image data from Cropper.js
      const canvas = cropper.getCroppedCanvas({
        width: 256,
        height: 256
      });

      // turn the canvas into a Blob (file object without a name)
      canvas.toBlob((blob) => {
        // update the image thumbnail with the new image data
        dz.createThumbnail(
          blob,
          dz.options.thumbnailWidth,
          dz.options.thumbnailHeight,
          dz.options.thumbnailMethod,
          false,
          (dataURL) => {
            // update the Dropzone file thumbnail
            dz.emit('thumbnail', file, dataURL);

            // return modified file to dropzone
            done(blob);
          }
        );
      });

      // hide the modal editor from view
      $modal.modal('hide');
    });

    // create Cropper.js
    const cropper = new Cropper($modal.find('.js-dropzone-cropper-img').get(0), {
      aspectRatio: 1
    });
  }
}
