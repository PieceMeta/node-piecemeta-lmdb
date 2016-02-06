var Promise = require('bluebird'),
    fs = require('fs-extra'),
    mkdirp = Promise.promisify(fs.mkdirp),
    _debug = typeof v8debug === 'object';

export default class Search {
    constructor(basepath) {
        this._indexes = [];
        this._basepath = null;
        this.setBasepath(basepath);
    }

    setBasepath(basepath) {
        this._basepath = require('path').resolve(basepath);
        if (_debug) console.log(`Index: ${this._basepath}`);
        return mkdirp(this._basepath);
    }

    index(resource) {
        var si;
        if (indexes.hasOwnProperty(resource)) {
            si = this._indexes[resource];
        } else {
            si = require('search-index')({indexPath: require('path').join(this._basepath, resource)});
            this._indexes[resource] = si;
        }
        return {
            si: si,
            query: (query) => {
                return Promise.promisify(si.search)({query: query})
                    .then((results) => {
                        return results.hits;
                    });
            },
            add: (document, schema) => {
                var properties = Object.keys(schema),
                    indexFields = [];
                for (let prop of properties) {
                    if (schema[prop].hasOwnProperty('index')) {
                        indexFields.push(prop);
                    }
                }
                return Promise.promisify(si.add)(document, {
                    fieldOptions: {fieldName: indexFields},
                    separator: /[ (\n)]+/
                });
            },
            remove: (documentId) => {
                return Promise.promisify(si.del)(documentId);
            },
            clear: () => {
                return Promise.promisify(si.empty)();
            },
            stat: () => {
                return Promise.promisify((cb) => {
                    si.tellMeAboutMySearchIndex((stat) => {
                        cb(null, stat);
                    });
                })();
            }
        };
    }
}