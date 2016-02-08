import SysController from './sys';
import SearchController from './search';

var lmdb = require('node-lmdb'),
    Promise = require('bluebird'),
    msgpack = require('msgpack'),
    assert = require('assert-plus'),
    uuid4 = require('uuid4'),
    _debug = typeof v8debug === 'object';

if (_debug) Promise.longStackTraces();

export default class MetaController {
    constructor(sys, searchBasepath) {
        this._models = {};
        this._sys = sys;
        this._search = new SearchController(searchBasepath);
    }

    registerModel(key, model) {
        this._models[key] = model;
    }

    query(resource, query = {}) {
        assert.string(resource, 'resource');

        let _self = this;

        return Promise.coroutine(function* () {
            let data = [],
                dbi = yield _self._sys.openDb(resource),
                txn = _self._sys.env.beginTxn({readOnly: true}),
                cursor = new lmdb.Cursor(txn, dbi),
                results = yield _self._search.index(resource).query(query);

            yield Promise.map(results, (item) => {
                cursor.goToKey(item.uuid);
                cursor.getCurrentBinary((key, buffer) => {
                    data.push(new _self._models[resource](msgpack.unpack(buffer)));
                });
            }, {concurrency: 1});

            cursor.close();
            txn.commit();
            _self._sys.closeDb(dbi);
            return data;
        })()
        .catch(SysController.errorHandler);
    }

    fetch(resource, uuid) {
        assert.string(resource, 'resource key must be string');
        assert.equal(require('uuid4').valid(uuid), true, 'UUID');

        let _self = this;

        return Promise.coroutine(function* () {
            let dbi = yield _self._sys.openDb(resource),
                txn = _self._sys.env.beginTxn({readOnly: true}),
                cursor = new lmdb.Cursor(txn, dbi);

            cursor.goToKey(uuid);
            return _self.getBinaryAsync(cursor, _self._models[resource])
                .then((data) => {
                    cursor.close();
                    txn.commit();
                    _self._sys.closeDb(dbi);
                    return data;
                });
        })()
        .catch(SysController.errorHandler);
    }

    create(resource, payload, override) {
        assert.string(resource, 'resource key must be string');
        assert.object(payload, 'payload must be an object');

        let _self = this;

        return Promise.coroutine(function* () {
            if (!_self._models.hasOwnProperty(resource)) {
                throw new Error(`LMDB model not registered for key: ${resource}`);
            }

            if (!override || !payload.uuid) payload.uuid = require('uuid4')();

            let dbi = yield _self._sys.openDb(resource),
                data = new _self._models[resource](payload),
                txn = _self._sys.env.beginTxn({readOnly: false});

            txn.putBinary(dbi, data.doc.uuid, data.toMsgpack());
            txn.commit();
            _self._sys.closeDb(dbi);

            return _self._search.index(resource).add(data.toObject())
                .then(function () {
                    return data;
                });
        })()
        .catch(SysController.errorHandler);
    }

    update(resource, uuid, payload) {
        assert.string(resource, 'resource key must be string');
        assert.equal(require('uuid4').valid(uuid), true, 'invalid UUID');
        assert.object(payload, 'payload must be an object');

        let _self = this;

        return Promise.coroutine(function* () {
            if (!_self._models.hasOwnProperty(resource)) {
                throw new Error(`LMDB model not registered for key: ${resource}`);
            }

            let dbi = yield _self._sys.openDb(resource),
                primaryKey = 'uuid',
                properties = Object.keys(payload),
                txn = _self._sys.env.beginTxn(),
                cursor = new lmdb.Cursor(txn, dbi),
                result = null;

            cursor.goToKey(uuid);
            return _self.getBinaryAsync(cursor, _self._models[resource])
                .then((result) => {
                    cursor.close();
                    for (let prop of properties) {
                        if (prop !== primaryKey && result.doc.hasOwnProperty(prop)) {
                            result.doc[prop] = payload[prop];
                        }
                    }
                    result.update();
                    txn.putBinary(dbi, uuid, result.toMsgpack());
                    txn.commit();
                    _self._sys.closeDb(dbi);
                    return result;
                })
                .then((result) => {
                    return _self._search.index(resource).add(result.toObject())
                        .then(function () {
                            return result;
                        });
                });
        })()
        .catch(SysController.errorHandler);
    }

    del(resource, uuid) {
        assert.string(resource, 'resource key must be string');
        assert.equal(require('uuid4').valid(uuid), true, 'invalid UUID');

        let _self = this;

        return Promise.coroutine(function* () {
            let dbi = yield _self._sys.openDb(resource);
            var txn = _self._sys.env.beginTxn();
            txn.del(dbi, uuid);
            txn.commit();
            _self._sys.closeDb(dbi);
        })()
        .catch(SysController.errorHandler);
    }

    getBinaryAsync(cursor, resource) {
        return Promise.promisify((cursor, resource, cb) => {
                cursor.getCurrentBinary((key, buffer) => {
                    cb(null, new resource(msgpack.unpack(buffer)));
                });
            })(cursor, resource)
            .catch((err) => {
                return null;
            });
    }
}