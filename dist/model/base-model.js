'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _search = require('../controller/search');

var _search2 = _interopRequireDefault(_search);

var _sys = require('../controller/sys');

var _sys2 = _interopRequireDefault(_sys);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Model = require('node-schema-object'),
    Promise = require('bluebird'),
    msgpack = require('msgpack');

var BaseModel = function () {
    function BaseModel(payload, schema) {
        (0, _classCallCheck3.default)(this, BaseModel);

        this._schema = schema;
        this._model = new Model(schema);
        this._doc = new this._model(payload);
        if (this._doc.hasOwnProperty('created') && typeof this._doc.created === 'undefined') this._doc.created = Date.now();
    }

    (0, _createClass3.default)(BaseModel, [{
        key: 'update',
        value: function update() {
            if (this._doc.hasOwnProperty('updated')) this._doc.updated = Date.now();
        }
    }, {
        key: 'toObject',
        value: function toObject() {
            var obj = this.doc.toObject();
            delete obj._model;
            delete obj._schema;
            return obj;
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            return (0, _stringify2.default)(this.toObject());
        }
    }, {
        key: 'toMsgpack',
        value: function toMsgpack() {
            return msgpack.pack(this.toObject());
        }
    }, {
        key: 'doc',
        get: function get() {
            return this._doc;
        }
    }]);
    return BaseModel;
}();

exports.default = BaseModel;