import BaseModel from './base-model';

export default class AccessTokenModel extends BaseModel {
    constructor(payload) {
        super(payload, {

            uuid: {type: String, primary: true},
            token: {type: String, index: true},
            api_key: {type: String, index: true, required: true},
            scopes: {type: Array, default: ['user'], arrayType: String, unique: true},
            issued: Date,
            hours_valid: {type: Number, default: 1440}

        });
    }

    isValid() {
        var expiration = new Date();
        expiration.setHours(expiration.getHours() + this.hours_valid);
        return this.issued < expiration;
    }

    generateAccessToken() {
        var secureRandom = require('secure-random');
        return secureRandom.randomBuffer(128).toString('hex');
    }
}