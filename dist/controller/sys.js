'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var lmdb = require('node-lmdb'),
    Promise = require('bluebird'),
    path = require('path'),
    fs = require('fs-extra'),
    mkdirp = Promise.promisify(fs.mkdirp),
    _debug = (typeof v8debug === 'undefined' ? 'undefined' : (0, _typeof3.default)(v8debug)) === 'object';

if (_debug) Promise.longStackTraces();

var SysController = function () {
    function SysController() {
        (0, _classCallCheck3.default)(this, SysController);

        this._env = new lmdb.Env();
    }

    (0, _createClass3.default)(SysController, [{
        key: 'openEnv',
        value: function openEnv(datapath, mapSize, maxDbs) {
            var _this = this;

            return mkdirp(datapath).then(function () {
                _this._env.open({
                    path: path.resolve(datapath),
                    mapSize: mapSize,
                    maxDbs: maxDbs,
                    maxReaders: 126
                });
                if (_debug) {
                    console.log('LMDB env: ' + datapath);
                    console.log('LMDB env: map size ' + mapSize / 1024 / 1024 + ' MB');
                    console.log('LMDB env: ' + maxDbs + ' DBs');
                }
                return _this._env;
            }).catch(this.errorHandler);
        }
    }, {
        key: 'closeEnv',
        value: function closeEnv() {
            var _this2 = this;

            return Promise.resolve().then(function () {
                _this2._env.close();
            }).catch(this.errorHandler);
        }
    }, {
        key: 'openDb',
        value: function openDb(dbName) {
            var _this3 = this;

            return Promise.resolve().then(function () {
                var dbi = _this3._env.openDbi({
                    name: dbName,
                    create: true
                });
                return dbi;
            }).catch(this.errorHandler);
        }
    }, {
        key: 'closeDb',
        value: function closeDb(dbi) {
            return Promise.resolve().then(function () {
                dbi.close();
            }).catch(this.errorHandler);
        }
    }, {
        key: 'dropDb',
        value: function dropDb(dbi, justFreePages) {
            return Promise.resolve().then(function () {
                dbi.drop({ justFreePages: justFreePages });
            }).catch(this.errorHandler);
        }
    }, {
        key: 'statDb',
        value: function statDb(dbi) {
            var _this4 = this;

            return Promise.resolve().then(function () {
                var txn = _this4._env.beginTxn({ readOnly: true }),
                    stat = new Object(txn.stat(dbi));

                txn.commit();
                return stat;
            }).catch(this.errorHandler);
        }
    }, {
        key: 'errorHandler',
        value: function errorHandler(err) {
            if (_debug) console.log(err.stack);
            throw err;
        }
    }, {
        key: 'PM_LMDB_PAD_FRAMENUM',
        get: function get() {
            return 12;
        }
    }, {
        key: 'PM_LMDB_SEP_FRAMES',
        get: function get() {
            return '/f/';
        }
    }, {
        key: 'env',
        get: function get() {
            return this._env;
        }
    }]);
    return SysController;
}();

exports.default = SysController;