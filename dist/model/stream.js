'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _baseModel = require('./base-model');

var _baseModel2 = _interopRequireDefault(_baseModel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var StreamModel = function (_BaseModel) {
    (0, _inherits3.default)(StreamModel, _BaseModel);

    function StreamModel(payload) {
        (0, _classCallCheck3.default)(this, StreamModel);
        return (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(StreamModel).call(this, payload, {

            uuid: { type: 'string', index: true, unique: true },
            channel_uuid: { type: 'string', index: true, required: true },
            package_uuid: { type: 'string', index: true, required: true },
            user_uuid: { type: 'string', index: true, required: true },
            title: { type: 'string', required: true },
            description: { type: 'string' },
            group: { type: 'string' },
            frameCount: { type: 'number' },
            labels: { type: 'array', required: true },
            format: { type: 'string' },
            fps: { type: 'number', required: true },

            created: 'date',
            updated: 'date'

        }));
    }

    return StreamModel;
}(_baseModel2.default);

exports.default = StreamModel;