import Sys from './sys';

var lmdb = require('node-lmdb'),
    Promise = require('bluebird'),
    assert = require('assert-plus'),
    uuid4 = require('uuid4'),
    _debug = typeof v8debug === 'object';

if (_debug) Promise.longStackTraces();

export default class StreamController {
    constructor(sys) {
        this._sys = sys;
    }

    getStreamData(meta, config = {}) {
        assert.equal(uuid4.valid(meta.uuid), true, 'meta must contain valid uuid');
        assert.equal(uuid4.valid(meta.package_uuid), true, 'meta must contain valid package uuid');

        let _self = this;

        config.from = config.from || 0;
        config.to = config.to || 1000;
        config.skip = config.skip || 1;

        return Promise.coroutine(function* () {
            var dbi = yield _self._sys.openDb(meta.package_uuid),
                txn = _self._sys.env.beginTxn({readOnly: true}),
                cursor = new lmdb.Cursor(txn, dbi),
                getBinaryAsync = Promise.promisify((callback) => {
                    cursor.getCurrentBinary((key, val) => {
                        callback(null, val);
                    });
                }),
                counter = 0,
                valueLength = _self.getLengthFromFormat(meta.format),
                position = 0,
                result = new Buffer((config.to - config.from) * meta.labels.length * valueLength / config.skip),
                loopstart = _self.getKey(meta.uuid, _self._sys.PM_LMDB_SEP_FRAMES, config.from),
                loopend = _self.getKey(meta.uuid, _self._sys.PM_LMDB_SEP_FRAMES, config.to);

            if (!cursor.goToKey(loopstart)) {
                throw new Error('Start frame not found for key ' + loopstart);
            }

            function loop(key) {
                if (key && key !== loopend) {
                    return getBinaryAsync().then((buffer) => {
                        buffer.copy(result, position);
                        counter += 1;
                        position += buffer.length;
                        return cursor.goToKey(
                            _self.getKey(meta.uuid, _self._sys.PM_LMDB_SEP_FRAMES, config.from + counter * config.skip)
                        );
                    }).then(loop);
                }
                return Promise.resolve(key);
            }

            return loop(cursor.goToKey(loopstart))
                .then(() => {
                    cursor.close();
                    txn.commit();
                    _self._sys.closeDb(dbi);
                    return result;
                });
        })()
        .catch(_self._sys.errorHandler);
    }

    putStreamData(meta, frameBuffer, config) {
        assert.equal(uuid4.valid(meta.uuid), true, 'meta must contain valid uuid');
        assert.equal(uuid4.valid(meta.package_uuid), true, 'meta must contain valid package uuid');
        assert.buffer(frameBuffer, 'frameBuffer must be of buffer type');
        assert.object(config, 'config must be an object');

        let valueLength = this.getLengthFromFormat(config.format),
            frameSize = valueLength * meta.labels.length,
            frameCount = frameBuffer.length / frameSize,
            _self = this;

        if (!config.from) {
            config.from = 0;
        }

        return Promise.coroutine(function* () {
            let dbi = yield _self._sys.openDb(meta.package_uuid),
                txn = _self._sys.env.beginTxn();

            for (let i = config.from; i < config.from + frameCount; i += 1) {
                let key = _self.getKey(meta.uuid, _self._sys.PM_LMDB_SEP_FRAMES, i);
                txn.putBinary(dbi, key, frameBuffer.slice(i * frameSize, (i + 1) * frameSize));
            }

            txn.commit();
            _self._sys.closeDb(dbi);
        })()
        .catch(_self._sys.errorHandler);
    }

    delStreamData(meta) {
        assert.equal(uuid4.valid(meta.uuid), true, 'meta must contain valid uuid');
        assert.equal(uuid4.valid(meta.package_uuid), true, 'meta must contain valid package uuid');

        let _self = this;

        return Promise.coroutine(function* () {
            let dbi = yield _self._sys.openDb(meta.package_uuid),
                txn = _self._sys.env.beginTxn(),
                cursor = new lmdb.Cursor(txn, dbi),
                counter = 0,
                loopstart = _self.getKey(meta.uuid, _self._sys.PM_LMDB_SEP_FRAMES, counter),
                key = cursor.goToKey(loopstart);

            while (key) {
                txn.del(dbi, key);
                counter += 1;
                key = cursor.goToKey(_self.getKey(meta.uuid, _self._sys.PM_LMDB_SEP_FRAMES, counter));
            }

            txn.commit();
        })()
        .catch(_self._sys.errorHandler);
    }

    padNumber(num, w) {
        num = num.toString();
        if (num.length >= w) return num;
        return new Array(w - num.length + 1).join('0') + num;
    }

    getKey(uuid, separator, frameNum) {
        var key = uuid + separator || '';
        if (typeof frameNum === 'number') key += this.padNumber(frameNum, this._sys.PM_LMDB_PAD_FRAMENUM);
        return key;
    }

    getFrameNumber(frameKey, separator) {
        var info = frameKey.split(separator);
        if (info.length === 2) return {stream_uuid: info[0], frame_number: parseInt(info[1])};
        return null;
    }

    getLengthFromFormat(format) {
        switch (format) {
            case 'double':
                return 8;
            case 'float':
                return 4;
            default:
                throw new Error('Unknown format: ' + format);
        }
    }
}