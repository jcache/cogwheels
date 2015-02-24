/**
 * @class LibSass.ImportSource
 * @abstract
 *
 * This is the format of an object asynchronously returned from {@link Cogwheels.Importer#find}.
 */

/**
 * @property {String} file
 *
 * The path to the file. *Required*.
 */

/**
 * @property {String} contents=null
 *
 * The contents of the file. If this is not set, it connotes an
 * import that was not found and will cause libsass to generate
 * an error for consumption.
 */
