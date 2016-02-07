import Search from '../controller/search';
import Sys from '../controller/sys';

var Model = require('node-schema-object'),
    Promise = require('bluebird'),
    msgpack = require('msgpack');

export default class BaseModel {
    constructor(payload, schema) {
        this._schema = schema;
        this._model = new Model(schema);
        this._doc = new this._model(payload);
        if (this._doc.hasOwnProperty('created') && typeof this._doc.created === 'undefined') this._doc.created = Date.now();
    }

    get doc() {
        return this._doc;
    }

    update() {
        if (this._doc.hasOwnProperty('updated')) this._doc.updated = Date.now();
    }

    toObject() {
        var obj = this.doc.toObject();
        delete obj._model;
        delete obj._schema;
        return obj;
    }

    toJSON() {
        return JSON.stringify(this.toObject());
    }

    toMsgpack() {
        return msgpack.pack(this.toObject());
    }
}