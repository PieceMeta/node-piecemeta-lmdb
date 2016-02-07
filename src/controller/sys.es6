var lmdb = require('node-lmdb'),
    Promise = require('bluebird'),
    path = require('path'),
    fs = require('fs-extra'),
    mkdirp = Promise.promisify(fs.mkdirp),
    _debug = typeof v8debug === 'object';

if (_debug) Promise.longStackTraces();

export default class Sys {
    constructor() {
        this._env = new lmdb.Env();
    }

    get PM_LMDB_PAD_FRAMENUM() {
        return 12;
    }

    get PM_LMDB_SEP_FRAMES() {
        return '/f/';
    }

    get env() {
        return this._env;
    }

    openEnv(datapath, mapSize, maxDbs) {
        return mkdirp(datapath)
            .then(() => {
                this._env.open({
                    path: path.resolve(datapath),
                    mapSize: mapSize,
                    maxDbs: maxDbs,
                    maxReaders: 126
                });
                if (_debug) {
                    console.log(`LMDB env: ${datapath}`);
                    console.log(`LMDB env: map size ${mapSize / 1024 / 1024} MB`);
                    console.log(`LMDB env: ${maxDbs} DBs`);
                }
                return this._env;
            })
            .catch(Sys.errorHandler);
    }

    closeEnv() {
        return Promise.resolve()
            .then(() => {
                this._env.close();
            })
            .catch(Sys.errorHandler);
    }

    openDb(dbName) {
        return Promise.resolve()
            .then(() => {
                var dbi = this._env.openDbi({
                    name: dbName,
                    create: true
                });
                return dbi;
            })
            .catch(Sys.errorHandler);
    }

    closeDb(dbi) {
        return Promise.resolve()
            .then(() => {
                dbi.close();
            })
            .catch(Sys.errorHandler);
    }

    dropDb(dbi, justFreePages) {
        return Promise.resolve()
            .then(() => {
                dbi.drop({justFreePages: justFreePages});
            })
            .catch(Sys.errorHandler);
    }

    statDb(dbi) {
        return Promise.resolve()
            .then(() => {
                var txn = this._env.beginTxn({readOnly: true}),
                    stat = new Object(txn.stat(dbi));

                txn.commit();
                return stat;
            })
            .catch(Sys.errorHandler);
    }

    errorHandler(err) {
        if (_debug) console.log(err.stack);
        throw err;
    }
}