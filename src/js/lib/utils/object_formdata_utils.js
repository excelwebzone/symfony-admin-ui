import _ from 'underscore';
import RecursiveIterator from 'recursive-iterator';

let {FormData} = window;
let {toString} = Object.prototype;
let {isArray, isObject, isUndefined} = _; // (!) YOU MUST IMPLEMENT THESE FUNCTIONS

/**
 * Returns type of anything.
 *
 * @param {Object} any
 *
 * @returns {String}
 */
function getType(any) {
  return toString.call(any).slice(8, -1);
}

/**
 * Converts path to FormData name.
 *
 * @param {Array} path
 *
 * @returns {String}
 */
function toName(path) {
  let array = path.map((part) => `[${part}]`);
  array[0] = path[0];
  return array.join('');
}

/**
 * @param {Object|Array} any
 * @returns {String}
 */
export function toQueryString(any) {
  if (!isObject(any) && !isArray(any)) {
    throw new TypeError('Argument must be object or array');
  }

  let stack = [];

  for(let {node, path} of new RecursiveIterator(any)) {
    if (isObject(node)) continue;
    let name = toName(path);
    let value = encodeURIComponent(node);
    stack.push(`${name}=${value}`);
  }

  return stack.join('&');
}

/**
 * Converts object to FormData.
 *
 * @param {Object} object
 *
 * @returns {FormData}
 */
export function objectToFormData(object) {
  if (!isObject(object)) {
    throw new TypeError('Argument must be object');
  }

  let form = new FormData();
  let iterator = new RecursiveIterator(object, 0, true);

  let appendToForm = function(path, node, filename) {
    let name = toName(path);
    if (isUndefined(filename)) {
      form.append(name, node);
    } else {
      form.append(name, node, filename);
    }
  };

  iterator.onStepInto = function({parent, node}) {
    let type = getType(node);
    switch (type) {
      case 'Array':
        return true; // step into
      case 'Object':
        return true; // step into
      case 'FileList':
        return true; // step into
      default:
        return false; // prevent step into
    }
  };

  for(let {node, path} of iterator) {
    var type = getType(node);
    switch (type) {
      case 'Array':
        break;
      case 'Object':
        break;
      case 'FileList':
        break;
      case 'File':
        appendToForm(path, node);
        break;
      case 'Blob':
        appendToForm(path, node, node.name);
        break;
      default:
        appendToForm(path, node);
        break;
    }
  }

  return form;
}
