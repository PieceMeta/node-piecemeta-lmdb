'use strict';

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _baseModel = require('./base-model');

var _baseModel2 = _interopRequireDefault(_baseModel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ApiKeyModel = function (_BaseModel) {
    (0, _inherits3.default)(ApiKeyModel, _BaseModel);

    function ApiKeyModel(payload) {
        (0, _classCallCheck3.default)(this, ApiKeyModel);

        var _this = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(ApiKeyModel).call(this, payload, {

            uuid: { type: 'string', primary: true },
            key: { type: 'string', index: true },
            secret: { type: 'string', index: true },
            user_uuid: { type: 'string', index: true, required: true },
            device_uuid: { type: 'string' },
            scopes: { type: 'array', default: ['user'], index: true },
            active: { type: 'boolean', index: true, default: true },

            created: 'date',
            updated: 'date'

        }));

        if (typeof _this.doc.key === 'undefined' || typeof _this.doc.secret === 'undefined') _this.generateApiCredentials();
        return _this;
    }

    (0, _createClass3.default)(ApiKeyModel, [{
        key: 'isScopeAllowed',
        value: function isScopeAllowed(scope) {
            return this.scopes.indexOf(scope) > -1;
        }
    }, {
        key: 'generateApiCredentials',
        value: function generateApiCredentials() {
            var secureRandom = require('secure-random'),
                sha1 = require('sha1');
            this.key = sha1(secureRandom.randomBuffer(8).toString('hex') + this.email + secureRandom.randomBuffer(8).toString('hex'));
            this.secret = secureRandom.randomBuffer(128).toString('hex');
        }
    }]);
    return ApiKeyModel;
}(_baseModel2.default);

exports.default = ApiKeyModel;