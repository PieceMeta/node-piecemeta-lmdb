'use strict';

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Promise = require('bluebird'),
    fs = require('fs-extra'),
    path = require('path'),
    Datastore = require('nedb'),
    mkdirp = Promise.promisify(fs.mkdirp),
    _debug = (typeof v8debug === 'undefined' ? 'undefined' : (0, _typeof3.default)(v8debug)) === 'object';

var SearchController = function () {
    function SearchController(basepath) {
        (0, _classCallCheck3.default)(this, SearchController);

        this._indexes = [];
        this._basepath = null;
        this.setBasepath(basepath);
    }

    (0, _createClass3.default)(SearchController, [{
        key: 'setBasepath',
        value: function setBasepath(basepath) {
            this._basepath = require('path').resolve(basepath);
            if (_debug) console.log('Index: ' + this._basepath);
            return mkdirp(this._basepath);
        }
    }, {
        key: 'index',
        value: function index(resource) {
            var index;
            if (this._indexes.hasOwnProperty(resource)) {
                index = this._indexes[resource];
            } else {
                index = new Datastore({ filename: path.join(this._basepath, resource) });
                this._indexes[resource] = index;
                this._indexes[resource].loadDatabase();
            }
            return {
                index: index,
                query: function query(_query) {
                    return Promise.promisify(function (query, cb) {
                        index.find(query, function (err, results) {
                            cb(err, results);
                        });
                    })(_query);
                },
                add: function add(document, schema) {
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
                    })({ uuid: document.uuid }, document, { upsert: true });
                },
                remove: function remove(documentId) {
                    return Promise.promisify(index.remove)({ uuid: documentId });
                },
                clear: function clear() {
                    return Promise.promisify(index.remove)({});
                }
            };
        }
    }]);
    return SearchController;
}();

exports.default = SearchController;