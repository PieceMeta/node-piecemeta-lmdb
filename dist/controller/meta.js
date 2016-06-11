'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _sys = require('./sys');

var _sys2 = _interopRequireDefault(_sys);

var _search = require('./search');

var _search2 = _interopRequireDefault(_search);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var lmdb = require('node-lmdb'),
    Promise = require('bluebird'),
    msgpack = require('msgpack'),
    assert = require('assert-plus'),
    uuid4 = require('uuid4'),
    _debug = (typeof v8debug === 'undefined' ? 'undefined' : (0, _typeof3.default)(v8debug)) === 'object';

if (_debug) Promise.longStackTraces();

var MetaController = function () {
    function MetaController(sys, searchBasepath) {
        (0, _classCallCheck3.default)(this, MetaController);

        this._models = {};
        this._sys = sys;
        this._search = new _search2.default(searchBasepath);
    }

    (0, _createClass3.default)(MetaController, [{
        key: 'registerModel',
        value: function registerModel(key, model) {
            this._models[key] = model;
        }
    }, {
        key: 'query',
        value: function query(resource) {
            var _query = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            assert.string(resource, 'resource');

            var _self = this;

            return Promise.coroutine(_regenerator2.default.mark(function _callee() {
                var data, dbi, txn, cursor, results;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                data = [];
                                _context.next = 3;
                                return _self._sys.openDb(resource);

                            case 3:
                                dbi = _context.sent;
                                txn = _self._sys.env.beginTxn({ readOnly: true });
                                cursor = new lmdb.Cursor(txn, dbi);
                                _context.next = 8;
                                return _self._search.index(resource).query(_query);

                            case 8:
                                results = _context.sent;
                                _context.next = 11;
                                return Promise.map(results, function (item) {
                                    cursor.goToKey(item.uuid);
                                    cursor.getCurrentBinary(function (key, buffer) {
                                        data.push(new _self._models[resource](msgpack.unpack(buffer)));
                                    });
                                }, { concurrency: 1 });

                            case 11:

                                cursor.close();
                                txn.commit();
                                _self._sys.closeDb(dbi);
                                return _context.abrupt('return', data);

                            case 15:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }))().catch(this._sys.errorHandler);
        }
    }, {
        key: 'fetch',
        value: function fetch(resource, uuid) {
            assert.string(resource, 'resource key must be string');
            assert.equal(require('uuid4').valid(uuid), true, 'UUID');

            var _self = this;

            return Promise.coroutine(_regenerator2.default.mark(function _callee2() {
                var dbi, txn, cursor;
                return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                _context2.next = 2;
                                return _self._sys.openDb(resource);

                            case 2:
                                dbi = _context2.sent;
                                txn = _self._sys.env.beginTxn({ readOnly: true });
                                cursor = new lmdb.Cursor(txn, dbi);


                                cursor.goToKey(uuid);
                                return _context2.abrupt('return', _self.getBinaryAsync(cursor, _self._models[resource]).then(function (data) {
                                    cursor.close();
                                    txn.commit();
                                    _self._sys.closeDb(dbi);
                                    return data;
                                }));

                            case 7:
                            case 'end':
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }))().catch(this._sys.errorHandler);
        }
    }, {
        key: 'create',
        value: function create(resource, payload, override) {
            assert.string(resource, 'resource key must be string');
            assert.object(payload, 'payload must be an object');

            var _self = this;

            return Promise.coroutine(_regenerator2.default.mark(function _callee3() {
                var dbi, data, txn;
                return _regenerator2.default.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                if (_self._models.hasOwnProperty(resource)) {
                                    _context3.next = 2;
                                    break;
                                }

                                throw new Error('LMDB model not registered for key: ' + resource);

                            case 2:

                                if (!override || !payload.uuid) payload.uuid = require('uuid4')();

                                _context3.next = 5;
                                return _self._sys.openDb(resource);

                            case 5:
                                dbi = _context3.sent;
                                data = new _self._models[resource](payload);
                                txn = _self._sys.env.beginTxn({ readOnly: false });


                                txn.putBinary(dbi, data.doc.uuid, data.toMsgpack());
                                txn.commit();
                                _self._sys.closeDb(dbi);

                                return _context3.abrupt('return', _self._search.index(resource).add(data.toObject()).then(function () {
                                    return data;
                                }));

                            case 12:
                            case 'end':
                                return _context3.stop();
                        }
                    }
                }, _callee3, this);
            }))().catch(this._sys.errorHandler);
        }
    }, {
        key: 'update',
        value: function update(resource, uuid, payload) {
            assert.string(resource, 'resource key must be string');
            assert.equal(require('uuid4').valid(uuid), true, 'invalid UUID');
            assert.object(payload, 'payload must be an object');

            var _self = this;

            return Promise.coroutine(_regenerator2.default.mark(function _callee4() {
                var dbi, primaryKey, properties, txn, cursor, result;
                return _regenerator2.default.wrap(function _callee4$(_context4) {
                    while (1) {
                        switch (_context4.prev = _context4.next) {
                            case 0:
                                if (_self._models.hasOwnProperty(resource)) {
                                    _context4.next = 2;
                                    break;
                                }

                                throw new Error('LMDB model not registered for key: ' + resource);

                            case 2:
                                _context4.next = 4;
                                return _self._sys.openDb(resource);

                            case 4:
                                dbi = _context4.sent;
                                primaryKey = 'uuid';
                                properties = (0, _keys2.default)(payload);
                                txn = _self._sys.env.beginTxn();
                                cursor = new lmdb.Cursor(txn, dbi);
                                result = null;


                                cursor.goToKey(uuid);
                                return _context4.abrupt('return', _self.getBinaryAsync(cursor, _self._models[resource]).then(function (result) {
                                    cursor.close();
                                    var _iteratorNormalCompletion = true;
                                    var _didIteratorError = false;
                                    var _iteratorError = undefined;

                                    try {
                                        for (var _iterator = (0, _getIterator3.default)(properties), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                            var prop = _step.value;

                                            if (prop !== primaryKey && result.doc.hasOwnProperty(prop)) {
                                                result.doc[prop] = payload[prop];
                                            }
                                        }
                                    } catch (err) {
                                        _didIteratorError = true;
                                        _iteratorError = err;
                                    } finally {
                                        try {
                                            if (!_iteratorNormalCompletion && _iterator.return) {
                                                _iterator.return();
                                            }
                                        } finally {
                                            if (_didIteratorError) {
                                                throw _iteratorError;
                                            }
                                        }
                                    }

                                    result.update();
                                    txn.putBinary(dbi, uuid, result.toMsgpack());
                                    txn.commit();
                                    _self._sys.closeDb(dbi);
                                    return result;
                                }).then(function (result) {
                                    return _self._search.index(resource).add(result.toObject()).then(function () {
                                        return result;
                                    });
                                }));

                            case 12:
                            case 'end':
                                return _context4.stop();
                        }
                    }
                }, _callee4, this);
            }))().catch(this._sys.errorHandler);
        }
    }, {
        key: 'del',
        value: function del(resource, uuid) {
            assert.string(resource, 'resource key must be string');
            assert.equal(require('uuid4').valid(uuid), true, 'invalid UUID');

            var _self = this;

            return Promise.coroutine(_regenerator2.default.mark(function _callee5() {
                var dbi, txn;
                return _regenerator2.default.wrap(function _callee5$(_context5) {
                    while (1) {
                        switch (_context5.prev = _context5.next) {
                            case 0:
                                _context5.next = 2;
                                return _self._sys.openDb(resource);

                            case 2:
                                dbi = _context5.sent;
                                txn = _self._sys.env.beginTxn();

                                txn.del(dbi, uuid);
                                txn.commit();
                                _self._sys.closeDb(dbi);

                            case 7:
                            case 'end':
                                return _context5.stop();
                        }
                    }
                }, _callee5, this);
            }))().catch(this._sys.errorHandler);
        }
    }, {
        key: 'getBinaryAsync',
        value: function getBinaryAsync(cursor, resource) {
            return Promise.promisify(function (cursor, resource, cb) {
                cursor.getCurrentBinary(function (key, buffer) {
                    cb(null, new resource(msgpack.unpack(buffer)));
                });
            })(cursor, resource).catch(function (err) {
                return null;
            });
        }
    }]);
    return MetaController;
}();

exports.default = MetaController;