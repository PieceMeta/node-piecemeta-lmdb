'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

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

var _baseModel = require('./base-model');

var _baseModel2 = _interopRequireDefault(_baseModel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Promise = require('bluebird');

var UserModel = function (_BaseModel) {
    (0, _inherits3.default)(UserModel, _BaseModel);

    function UserModel(payload) {
        (0, _classCallCheck3.default)(this, UserModel);
        return (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(UserModel).call(this, payload, {

            uuid: { type: 'string', index: true, unique: true },
            name: { type: 'string', required: true },
            email: { type: 'string', required: true, unique: true },
            crypted_password: { type: 'string', required: true },
            password_salt: { type: 'string', required: true },
            confirmed: { type: 'boolean', default: true, index: true }, // TODO: bring back user confirmation
            blocked: { type: 'boolean', default: false },
            last_login: { type: 'date' },
            failed_logins: { type: 'number', default: 0 },
            single_access_token: { type: 'string', index: true },

            created: 'date',
            updated: 'date'

        }));
    }

    (0, _createClass3.default)(UserModel, [{
        key: 'isValidPassword',
        value: function isValidPassword(password) {
            var _this2 = this;

            if (this.failed_logins > 3 && Date.now() - this.last_login < 300000) {
                throw new Error('Too many failed login attempts. Account blocked for 5 minutes.');
            } else {
                return this.encryptPassword(password, this.password_salt).then(function (password_hash) {
                    _this2.last_login = Date.now();
                    var loginSuccess = _this2.crypted_password === password_hash;
                    if (!loginSuccess) {
                        _this2.failed_logins += 1;
                    } else {
                        _this2.failed_logins = 0;
                    }
                    return loginSuccess;
                });
            }
        }
    }, {
        key: 'generatePasswordSalt',
        value: function generatePasswordSalt() {
            var secureRandom = require('secure-random');
            var saltbytes = secureRandom.randomBuffer(48);
            return saltbytes.toString('hex');
        }
    }, {
        key: 'encryptPassword',
        value: function encryptPassword(password, salt) {
            var crypto = require('crypto');
            return Promise.promisify(crypto.pbkdf2)(password, salt, 80000, 256).then(function (hash_bytes) {
                return hash_bytes ? hash_bytes.toString('hex') : null;
            });
        }
    }, {
        key: 'generateUUID',
        value: function generateUUID() {
            if (this.email) {
                var ns = createUUIDv5('null', 'piecemeta.com', true);
                this.uuid = require('uuidv5')(ns, email);
            }
        }
    }, {
        key: 'generateSingleAccessToken',
        value: function generateSingleAccessToken() {
            var sha1 = require('sha1');
            this.single_access_token = sha1(this.email + Math.round(Math.random() * 1000000).toString());
        }
    }]);
    return UserModel;
}(_baseModel2.default);

exports.default = UserModel;