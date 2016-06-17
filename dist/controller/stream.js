'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var lmdb = require('node-lmdb'),
    Promise = require('bluebird'),
    assert = require('assert-plus'),
    uuid4 = require('uuid4'),
    _debug = (typeof v8debug === 'undefined' ? 'undefined' : (0, _typeof3.default)(v8debug)) === 'object';

if (_debug) Promise.longStackTraces();

var StreamController = function () {
    function StreamController(sys) {
        (0, _classCallCheck3.default)(this, StreamController);

        this._sys = sys;
    }

    (0, _createClass3.default)(StreamController, [{
        key: 'getStreamData',
        value: function getStreamData(meta) {
            var config = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            assert.equal(uuid4.valid(meta.uuid), true, 'meta must contain valid uuid');
            assert.equal(uuid4.valid(meta.package_uuid), true, 'meta must contain valid package uuid');

            var _self = this;

            config.from = config.from || 0;
            config.to = config.to || 1000;
            config.skip = config.skip || 1;

            return Promise.coroutine(_regenerator2.default.mark(function _callee() {
                var dbi, txn, cursor, getBinaryAsync, counter, valueLength, position, result, loopstart, loopend, loop;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                loop = function loop(key) {
                                    if (key && key !== loopend) {
                                        return getBinaryAsync().then(function (buffer) {
                                            buffer.copy(result, position);
                                            counter += 1;
                                            position += buffer.length;
                                            return cursor.goToKey(_self.getKey(meta.uuid, _self._sys.PM_LMDB_SEP_FRAMES, config.from + counter * config.skip));
                                        }).then(loop);
                                    }
                                    return Promise.resolve(key);
                                };

                                _context.next = 3;
                                return _self._sys.openDb(meta.package_uuid);

                            case 3:
                                dbi = _context.sent;
                                txn = _self._sys.env.beginTxn({ readOnly: true });
                                cursor = new lmdb.Cursor(txn, dbi);
                                getBinaryAsync = Promise.promisify(function (callback) {
                                    cursor.getCurrentBinary(function (key, val) {
                                        callback(null, val);
                                    });
                                });
                                counter = 0;
                                valueLength = _self.getLengthFromFormat(meta.format);
                                position = 0;
                                result = new Buffer((config.to - config.from) * meta.labels.length * valueLength / config.skip);
                                loopstart = _self.getKey(meta.uuid, _self._sys.PM_LMDB_SEP_FRAMES, config.from);
                                loopend = _self.getKey(meta.uuid, _self._sys.PM_LMDB_SEP_FRAMES, config.to);

                                if (cursor.goToKey(loopstart)) {
                                    _context.next = 15;
                                    break;
                                }

                                throw new Error('Start frame not found for key ' + loopstart);

                            case 15:
                                return _context.abrupt('return', loop(cursor.goToKey(loopstart)).then(function () {
                                    cursor.close();
                                    txn.commit();
                                    _self._sys.closeDb(dbi);
                                    return result;
                                }));

                            case 16:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }))().catch(_self._sys.errorHandler);
        }
    }, {
        key: 'putStreamData',
        value: function putStreamData(meta, frameBuffer, config) {
            assert.equal(uuid4.valid(meta.uuid), true, 'meta must contain valid uuid');
            assert.equal(uuid4.valid(meta.package_uuid), true, 'meta must contain valid package uuid');
            assert.buffer(frameBuffer, 'frameBuffer must be of buffer type');
            assert.object(config, 'config must be an object');

            var valueLength = this.getLengthFromFormat(config.format),
                frameSize = valueLength * meta.labels.length,
                frameCount = frameBuffer.length / frameSize,
                _self = this;

            if (!config.from) {
                config.from = 0;
            }

            return Promise.coroutine(_regenerator2.default.mark(function _callee2() {
                var dbi, txn, i, key;
                return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                _context2.next = 2;
                                return _self._sys.openDb(meta.package_uuid);

                            case 2:
                                dbi = _context2.sent;
                                txn = _self._sys.env.beginTxn();


                                for (i = config.from; i < config.from + frameCount; i += 1) {
                                    key = _self.getKey(meta.uuid, _self._sys.PM_LMDB_SEP_FRAMES, i);

                                    txn.putBinary(dbi, key, frameBuffer.slice(i * frameSize, (i + 1) * frameSize));
                                }

                                txn.commit();
                                _self._sys.closeDb(dbi);

                            case 7:
                            case 'end':
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }))().catch(_self._sys.errorHandler);
        }
    }, {
        key: 'delStreamData',
        value: function delStreamData(meta) {
            assert.equal(uuid4.valid(meta.uuid), true, 'meta must contain valid uuid');
            assert.equal(uuid4.valid(meta.package_uuid), true, 'meta must contain valid package uuid');

            var _self = this;

            return Promise.coroutine(_regenerator2.default.mark(function _callee3() {
                var dbi, txn, cursor, counter, loopstart, key;
                return _regenerator2.default.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                _context3.next = 2;
                                return _self._sys.openDb(meta.package_uuid);

                            case 2:
                                dbi = _context3.sent;
                                txn = _self._sys.env.beginTxn();
                                cursor = new lmdb.Cursor(txn, dbi);
                                counter = 0;
                                loopstart = _self.getKey(meta.uuid, _self._sys.PM_LMDB_SEP_FRAMES, counter);
                                key = cursor.goToKey(loopstart);


                                while (key) {
                                    txn.del(dbi, key);
                                    counter += 1;
                                    key = cursor.goToKey(_self.getKey(meta.uuid, _self._sys.PM_LMDB_SEP_FRAMES, counter));
                                }

                                txn.commit();

                            case 10:
                            case 'end':
                                return _context3.stop();
                        }
                    }
                }, _callee3, this);
            }))().catch(_self._sys.errorHandler);
        }
    }, {
        key: 'padNumber',
        value: function padNumber(num, w) {
            num = num.toString();
            if (num.length >= w) return num;
            return new Array(w - num.length + 1).join('0') + num;
        }
    }, {
        key: 'getKey',
        value: function getKey(uuid, separator, frameNum) {
            var key = uuid + separator || '';
            if (typeof frameNum === 'number') key += this.padNumber(frameNum, this._sys.PM_LMDB_PAD_FRAMENUM);
            return key;
        }
    }, {
        key: 'getFrameNumber',
        value: function getFrameNumber(frameKey, separator) {
            var info = frameKey.split(separator);
            if (info.length === 2) return { stream_uuid: info[0], frame_number: parseInt(info[1]) };
            return null;
        }
    }, {
        key: 'getLengthFromFormat',
        value: function getLengthFromFormat(format) {
            switch (format) {
                case 'double':
                    return 8;
                case 'float':
                    return 4;
                default:
                    throw new Error('Unknown format: ' + format);
            }
        }
    }]);
    return StreamController;
}();

exports.default = StreamController;