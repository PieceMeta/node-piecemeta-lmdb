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
        if (typeof this.doc.token === 'undefined') this.doc.token = this.generateAccessToken();
        if (typeof this.doc.issued === 'undefined') this.doc.issued = Date.now();
    }

    isValid() {
        var expiration = this.doc.issued;
        expiration.setHours(expiration.getHours() + this.doc.hours_valid);
        return expiration.getTime() > Date.now();
    }

    generateAccessToken() {
        var secureRandom = require('secure-random');
        return secureRandom.randomBuffer(128).toString('hex');
    }
}