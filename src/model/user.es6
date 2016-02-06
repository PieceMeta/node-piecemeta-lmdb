import BaseModel from './base-model';
var Promise = require('bluebird');

export default class UserModel extends BaseModel {
    constructor(payload) {
        super(payload, {

            uuid: {type: 'string', index: true, unique: true},
            name: {type: 'string', required: true},
            email: {type: 'string', required: true, unique: true},
            crypted_password: {type: 'string', required: true},
            password_salt: {type: 'string', required: true},
            confirmed: {type: 'boolean', default: true, index: true}, // TODO: bring back user confirmation
            blocked: {type: 'boolean', default: false},
            last_login: {type: 'date'},
            failed_logins: {type: 'number', default: 0},
            single_access_token: {type: 'string', index: true},

            created: 'date',
            updated: 'date'

        });
    }

    isValidPassword(password) {
        if (this.failed_logins > 3 && Date.now() - this.last_login < 300000) {
            throw new Error('Too many failed login attempts. Account blocked for 5 minutes.');
        } else {
            return this.encryptPassword(password, this.password_salt)
                .then((password_hash) => {
                    this.last_login = Date.now();
                    var loginSuccess = this.crypted_password === password_hash;
                    if (!loginSuccess) {
                        this.failed_logins += 1;
                    } else {
                        this.failed_logins = 0;
                    }
                    return loginSuccess;
                });
        }
    }

    generatePasswordSalt() {
        var secureRandom = require('secure-random');
        var saltbytes = secureRandom.randomBuffer(48);
        return saltbytes.toString('hex');
    }

    encryptPassword(password, salt) {
        var crypto = require('crypto');
        return Promise.promisify(crypto.pbkdf2)(password, salt, 80000, 256)
            .then((hash_bytes) => {
                return hash_bytes ? hash_bytes.toString('hex') : null;
            });
    }

    generateUUID() {
        if (this.email) {
            var ns = createUUIDv5('null', 'piecemeta.com', true);
            this.uuid = require('uuidv5')(ns, email);
        }
    }

    generateSingleAccessToken() {
        var sha1 = require('sha1');
        this.single_access_token = sha1(this.email + Math.round(Math.random() * 1000000).toString());
    }
}