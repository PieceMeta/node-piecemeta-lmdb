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

var _meta = require('./controller/meta');

var _meta2 = _interopRequireDefault(_meta);

var _search = require('./controller/search');

var _search2 = _interopRequireDefault(_search);

var _stream = require('./controller/stream');

var _stream2 = _interopRequireDefault(_stream);

var _sys = require('./controller/sys');

var _sys2 = _interopRequireDefault(_sys);

var _accessToken = require('./model/access-token');

var _accessToken2 = _interopRequireDefault(_accessToken);

var _apiKey = require('./model/api-key');

var _apiKey2 = _interopRequireDefault(_apiKey);

var _channel = require('./model/channel');

var _channel2 = _interopRequireDefault(_channel);

var _package = require('./model/package');

var _package2 = _interopRequireDefault(_package);

var _stream3 = require('./model/stream');

var _stream4 = _interopRequireDefault(_stream3);

var _user = require('./model/user');

var _user2 = _interopRequireDefault(_user);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _debug = (typeof v8debug === 'undefined' ? 'undefined' : (0, _typeof3.default)(v8debug)) === 'object';

var PiecemetaLmdb = function () {
    function PiecemetaLmdb() {
        (0, _classCallCheck3.default)(this, PiecemetaLmdb);

        this._sys = new _sys2.default();
    }

    (0, _createClass3.default)(PiecemetaLmdb, [{
        key: 'open',
        value: function open(lmdbDataPath, indexDataPath, mapSize, dbCount) {
            var _this = this;

            return this._sys.openEnv(lmdbDataPath, mapSize, dbCount).then(function () {
                _this._stream = new _stream2.default(_this._sys);
                _this._meta = new _meta2.default(_this._sys, indexDataPath);
                var _arr = [_accessToken2.default, _apiKey2.default, _channel2.default, _package2.default, _stream4.default, _user2.default];
                for (var _i = 0; _i < _arr.length; _i++) {
                    var model = _arr[_i];
                    _this._meta.registerModel(model.name.replace(/Model$/, ''), model);
                    if (_debug) console.log('Registered model: ' + model.name.replace(/Model$/, ''));
                }
            });
        }
    }, {
        key: 'meta',
        get: function get() {
            return this._meta;
        }
    }, {
        key: 'stream',
        get: function get() {
            return this._stream;
        }
    }, {
        key: 'sys',
        get: function get() {
            return this._sys;
        }
    }]);
    return PiecemetaLmdb;
}();

exports.default = PiecemetaLmdb;