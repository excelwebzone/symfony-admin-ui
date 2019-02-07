import 'underscore';
import './jquery';
import './bootstrap';
import './froala_editor';
import '../utils/axios_utils';

// Polyfill: add compatible Object.entries support in older environments.
if (typeof Object.entries !== 'function') {
  Object.entries = function(obj) {
    const ownProps = Object.keys(obj);

    let i = ownProps.length;
    let resArray = new Array(i);

    while (i--) {
      resArray[i] = [ownProps[i], obj[ownProps[i]]];
    }

    return resArray;
  };
}
