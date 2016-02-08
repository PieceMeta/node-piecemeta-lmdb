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

var AccessTokenModel = function (_BaseModel) {
    (0, _inherits3.default)(AccessTokenModel, _BaseModel);

    function AccessTokenModel(payload) {
        (0, _classCallCheck3.default)(this, AccessTokenModel);

        var _this = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(AccessTokenModel).call(this, payload, {

            uuid: { type: String, primary: true },
            token: { type: String, index: true },
            api_key: { type: String, index: true, required: true },
            scopes: { type: Array, default: ['user'], arrayType: String, unique: true },
            issued: Date,
            hours_valid: { type: Number, default: 1440 }

        }));

        if (typeof _this.doc.token === 'undefined') _this.doc.token = _this.generateAccessToken();
        if (typeof _this.doc.issued === 'undefined') _this.doc.issued = Date.now();
        return _this;
    }

    (0, _createClass3.default)(AccessTokenModel, [{
        key: 'isValid',
        value: function isValid() {
            var expiration = this.doc.issued;
            expiration.setHours(expiration.getHours() + this.doc.hours_valid);
            return expiration.getTime() > Date.now();
        }
    }, {
        key: 'generateAccessToken',
        value: function generateAccessToken() {
            var secureRandom = require('secure-random');
            return secureRandom.randomBuffer(128).toString('hex');
        }
    }]);
    return AccessTokenModel;
}(_baseModel2.default);

exports.default = AccessTokenModel;