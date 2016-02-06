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
    }

    get doc() {
        return this._doc;
    }

    save() {
        return Promise.coroutine(function* () {
            if (typeof this.onSave === 'function') yield this.onSave();

            if (typeof this.uuid !== 'string') this.uuid = require('uuid4')();

            var dbi = yield lmdbSys.openDb(this.constructor.name),
                txn = lmdbSys.getEnv().beginTxn();

            txn.putBinary(dbi, this.uuid, this.toMsgpack());
            txn.commit();

            yield lmdbSys.closeDb(dbi);

            yield search.index(this.constructor.name)
                .add(this.toObject(), this.constructor.name);

            return true;
        })();
    }

    remove() {
        return Promise.coroutine(function* () {
            if (typeof this.onRemove === 'function') yield this.onRemove();

            var dbi = yield lmdbSys.openDb(this.constructor.name),
                txn = lmdbSys.getEnv().beginTxn();

            txn.del(dbi, this.uuid);
            txn.commit();

            yield lmdbSys.closeDb(dbi);

            return true;
        })();
    }

    toObject() {
        var obj = this.toObject();
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