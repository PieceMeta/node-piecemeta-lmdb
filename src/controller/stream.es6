import Sys from './sys';
import PM_LMDB_SEP_FRAMES from './sys';
import PM_LMDB_PAD_FRAMENUM from './sys';

var lmdb = require('node-lmdb'),
    Promise = require('bluebird'),
    assert = require('assert-plus'),
    _debug = typeof v8debug === 'object';

if (_debug) Promise.longStackTraces();

export default class Stream {
    constructor(env) {
        this.setEnv(env);
    }

    setEnv(env) {
        this._env = env;
    }

    getStreamData(dbi, uuid, config) {
        assert.object(dbi, 'Dbi');
        assert.true(require('uuid4')(uuid), 'UUID');

        if (Object.getPrototypeOf(config) !== Object.prototype) {
            config = {};
        }
        config.from = config.from || 0;
        config.to = config.to || 1000;
        config.skip = config.skip || 1;

        return Promise.resolve()
            .then(() => {
                var txn = this._env.beginTxn({readOnly: true}),
                    cursor = new lmdb.Cursor(txn, dbi),
                    getBinaryAsync = Promise.promisify((callback) => {
                        cursor.getCurrentBinary((key, val) => {
                            callback(null, val);
                        });
                    }),
                    counter = 0,
                    results = [],
                    loopstart = Stream.getKey(uuid, PM_LMDB_SEP_FRAMES, config.from),
                    loopend = Stream.getKey(uuid, PM_LMDB_SEP_FRAMES, config.to);

                if (!cursor.goToKey(loopstart)) {
                    throw new Error('Start frame not found for key ' + loopstart);
                }

                function loop(key) {
                    if (key && key !== loopend) {
                        return getBinaryAsync().then((buffer) => {

                            results.push(new Buffer(buffer));
                            counter += 1;

                            return cursor.goToKey(
                                Stream.getKey(
                                    uuid,
                                    PM_LMDB_SEP_FRAMES,
                                    config.from + counter * config.skip
                                )
                            );
                        }).then(loop);
                    }
                    return Promise.resolve(key);
                }

                return loop(cursor.goToKey(loopstart))
                    .then(() => {
                        cursor.close();
                        txn.commit();
                        return results;
                    });
            })
            .catch(Sys.errorHandler);
    }

    putStreamData(dbi, uuid, frameBuffer, config) {
        assert.object(dbi, 'Dbi');
        assert.true(require('uuid4')(uuid), 'UUID');
        assert.object(config, 'config');

        var from = config.from,
            frameSize = config.valueLength * config.valueCount,
            frameCount = frameBuffer.length / frameSize;

        return Promise.resolve()
            .then(() => {
                var txn = this._env.beginTxn();

                for (var i = 0; i < from + frameCount; i += 1) {
                    var key = Stream.getKey(uuid, PM_LMDB_SEP_FRAMES, i);
                    txn.putBinary(dbi, key, frameBuffer.slice(i * frameSize, (i + 1) * frameSize));
                }

                txn.commit();
            })
            .catch(Sys.errorHandler);
    }

    delStreamData(dbi, uuid) {
        assert.object(dbi, 'Dbi');
        assert.true(require('uuid4')(uuid), 'UUID');

        return Promise.resolve()
            .then(() => {
                var txn = this._env.beginTxn(),
                    cursor = new lmdb.Cursor(txn, dbi),
                    counter = 0,
                    loopstart = Stream.getKey(uuid, PM_LMDB_SEP_FRAMES, counter);

                txn.del(dbi, Stream.getKey(uuid));

                for (var key = cursor.goToKey(loopstart); key;
                     key = cursor.goToKey(
                         Stream.getKey(
                             uuid,
                             PM_LMDB_SEP_FRAMES,
                             counter
                         )
                     )) {

                    txn.del(dbi, key);
                    counter += 1;
                }

                txn.commit();
            })
            .catch(Sys.errorHandler);
    }

    padNumber(num, w) {
        num = num.toString();

        if (num.length >= w) {
            return num;
        } else {
            return new Array(w - num.length + 1).join('0') + num;
        }
    }

    getKey(uuid, separator, frameNum) {
        var key = uuid;

        key += separator || '';

        if (typeof frameNum === 'number') {
            key += Stream.padNumber(frameNum, PM_LMDB_PAD_FRAMENUM);
        }

        return key;
    }

    getFrameNumber(frameKey, separator) {
        var info = frameKey.split(separator);

        if (info.length === 2) {
            return {stream_uuid: info[0], frame_number: parseInt(info[1])};
        } else {
            return null;
        }
    }
}