import Sys from './sys';
import Search from './search';

var lmdb = require('node-lmdb'),
    Promise = require('bluebird'),
    msgpack = require('msgpack'),
    assert = require('assert-plus'),
    _debug = typeof v8debug === 'object';

if (_debug) Promise.longStackTraces();

export default class Meta {
    constructor(env, searchBasepath) {
        this.setEnv(env);
        this._models = {};
        this._env = null;
        this._search = new Search(searchBasepath);
    }

    setEnv(env) {
        this._env = env;
    }

    registerModel(key, model) {
        this._models[key] = model;
    }

    getModel(key) {
        return this._models[key];
    }

    query(dbi, resource, query = {}) {
        assert.object(dbi, 'Dbi');
        assert.string(resource, 'resource');

        return Promise.coroutine(function* () {

            if (Object.keys(query).length === 0) {
                query = {'*': ['*']};
            }

            let data = [], txn = this._env.beginTxn({readOnly: true}),
                cursor = new lmdb.Cursor(txn, dbi),
                results = yield this._search.index(resource).query(query);

            yield Promise.map(results, (hit) => {
                cursor.goToKey(hit.document.uuid);
                cursor.getCurrentBinary((key, buffer) => {
                    data.push(msgpack.unpack(buffer));
                });
            }, {concurrency: 1});

            cursor.close();
            txn.commit();
            return data;
        })();
    }

    get(dbi, resource, uuid) {
        assert.object(dbi, 'Dbi');
        assert.true(require('uuid4')(uuid), 'UUID');

        return Promise.resolve()
            .then(function () {
                var model = lmdbModel(this._schemas[resource], {});
                return model.fetch(uuid);
            })
            .catch(Sys.errorHandler);
    }

    create(dbi, schemaKey, payload, override) {
        assert.object(dbi, 'Dbi');
        assert.string(schemaKey, 'schemaKey');
        assert.object(payload, 'payload');

        return Promise.resolve()
            .then(function () {

                if (!this._schemas.hasOwnProperty(schemaKey)) {
                    throw new Error('LMDB Meta schema not registered for key: ' + schemaKey);
                }

                // TODO: re-enable this for new model structure
                /*
                 if (!override || !payload.uuid) {
                 payload.uuid = require('uuid4')();
                 }
                 */

                return new this._models[schemaKey](payload);
            })
            .catch(Sys.errorHandler);
    }

    update(dbi, schemaKey, uuid, payload) {
        assert.object(dbi, 'Dbi');
        assert.string(schemaKey, 'schemaKey');
        assert.true(require('uuid4')(uuid), 'UUID');
        assert.object(payload, 'payload');

        return Promise.resolve()
            .then(function () {

                if (!this._schemas.hasOwnProperty(schemaKey)) {
                    throw new Error('LMDB Meta schema not registered for key: ' + schemaKey);
                }

                var model = lmdbModel({}, schemaKey, {});

                var schema = this._schemas[schemaKey],
                    primaryKey = 'uuid',
                    properties = Object.keys(payload),
                    txn = this._env.beginTxn(),
                    cursor = new lmdb.Cursor(txn, dbi),
                    result;

                cursor.goToKey(uuid);
                cursor.getCurrentBinary(unpackResult);

                function unpackResult(key, buffer) {
                    result = msgpack.unpack(buffer);
                }

                cursor.close();

                for (let prop of properties) {
                    if (schema[prop] && !(payload[prop] instanceof Function)) {
                        if (schema[prop].hasOwnProperty('protected')) {
                            delete payload[prop];
                        }
                        if (schema[prop].hasOwnProperty('primary')) {
                            primaryKey = prop;
                        }
                        result[prop] = payload[prop];
                    }
                }

                if (!payload.hasOwnProperty(primaryKey)) {
                    throw new Error('LMDB Meta expected primary key not found: ' + primaryKey);
                }

                var buffer = msgpack.pack(payload);

                txn.putBinary(dbi, primaryKey, buffer);
                txn.commit();

                return this._search.index(schemaKey).add(result, schema);
            })
            .catch(Sys.errorHandler);
    }

    del(dbi, uuid) {
        assert.object(dbi, 'Dbi');
        assert.true(require('uuid4')(uuid), 'UUID');

        return Promise.resolve()
            .then(function () {
                var txn = this._env.beginTxn();
                txn.del(dbi, uuid);
                txn.commit();
            })
            .catch(Sys.errorHandler);
    }
}