import BaseModel from './base-model';

export default class ApiKeyModel extends BaseModel {
    constructor(payload) {
        super(payload, {

            uuid: {type: 'string', primary: true},
            key: {type: 'string', index: true},
            secret: {type: 'string', index: true},
            user_uuid: {type: 'string', index: true, required: true},
            device_uuid: {type: 'string'},
            scopes: {type: 'array', default: ['user'], index: true},
            active: {type: 'boolean', index: true, default: true},

            created: 'date',
            updated: 'date'

        });
    }

    isScopeAllowed(scope) {
        return this.scopes.indexOf(scope) > -1;
    }

    generateApiCredentials() {
        var secureRandom = require('secure-random'),
            sha1 = require('sha1');
        this.key = sha1(secureRandom.randomBuffer(8).toString('hex') + this.email + secureRandom.randomBuffer(8).toString('hex'));
        this.secret = secureRandom.randomBuffer(128).toString('hex');
    }
}