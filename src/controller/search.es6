var Promise = require('bluebird'),
    fs = require('fs-extra'),
    path = require('path'),
    Datastore = require('nedb'),
    mkdirp = Promise.promisify(fs.mkdirp),
    _debug = typeof v8debug === 'object';

export default class SearchController {
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
        var index;
        if (this._indexes.hasOwnProperty(resource)) {
            index = this._indexes[resource];
        } else {
            index = new Datastore({filename: path.join(this._basepath, resource)});
            this._indexes[resource] = index;
            this._indexes[resource].loadDatabase();
        }
        return {
            index: index,
            query: (query) => {
                return Promise.promisify(function (query, cb) {
                    index.find(query, function (err, results) {
                        cb(err, results);
                    });
                })(query);
            },
            add: (document, schema) => {
                var indexFields = [];
                    //properties = Object.keys(schema);
                /*
                for (let prop of properties) {
                    if (schema[prop].hasOwnProperty('index')) {
                        indexFields.push(prop);
                    }
                }
                */
                return Promise.promisify(function (query, doc, options, cb) {
                    index.update(query, doc, options, function (err) {
                        cb(err);
                    });
                })({uuid: document.uuid}, document, {upsert: true});
            },
            remove: (documentId) => {
                return Promise.promisify(index.remove)({uuid: documentId});
            },
            clear: () => {
                return Promise.promisify(index.remove)({});
            }
        };
    }
}