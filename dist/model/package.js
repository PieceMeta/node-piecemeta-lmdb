'use strict';

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

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

var PackageModel = function (_BaseModel) {
    (0, _inherits3.default)(PackageModel, _BaseModel);

    function PackageModel(payload) {
        (0, _classCallCheck3.default)(this, PackageModel);
        return (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(PackageModel).call(this, payload, {

            uuid: { type: String, minLength: 1, index: true },
            user_uuid: { type: String, minLength: 1, index: true },
            title: { type: String, minLength: 1 },
            description: String,

            created: Date,
            updated: Date

        }));
    }

    return PackageModel;
}(_baseModel2.default);

exports.default = PackageModel;