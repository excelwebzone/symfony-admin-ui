import _ from 'underscore';

// Helper functions for handling form data objects

/**
 * Remove items from an object if their
 * value is falsey or not a number
 *
 * @param {Object} object
 *
 * @return {Object}
 */
let _empty = (object) => {
  return _.pick(object, function(value) {
    return !_.isEmpty(value) && (_.identity(value) || _.isNumber(value));
  });
};

// Recursively remove items with no value from an object
// Ignores arrays.
export function withoutEmpty(object) {
  _.keys(object).map(function(key) {
    if (!_.isArray(object[key]) && _.isObject(object[key])) {
      object[key] = withoutEmpty(object[key]);
    }
  });

  return _empty(object);
}

export function emptyKeepFalsey(object) {
  return _.omit(object, i => i === null || i === undefined || i.length === 0);
}

// Recursively remove items with string length 0 from an object
// Ignores arrays.
export function emptyWithFalse(object) {
  _.keys(object).map(function(key) {
    if (!_.isArray(object[key]) && _.isObject(object[key])) {
      object[key] = emptyWithFalse(object[key]);
    }
  });

  return emptyKeepFalsey(object);
}
