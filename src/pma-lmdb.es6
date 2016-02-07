import Meta from './controller/meta';
import Search from './controller/search';
import Stream from './controller/stream';
import Sys from './controller/sys';

import AccessTokenModel from './model/access-token';
import ApiKeyModel from './model/api-key';
import ChannelModel from './model/channel';
import PackageModel from './model/package';
import StreamModel from './model/stream';
import UserModel from './model/user';

var _debug = typeof v8debug === 'object';

export default class PmaLmdb {
    constructor() {
        this._sys = new Sys();
    }

    open(lmdbDataPath, indexDataPath, mapSize, dbCount) {
        return this._sys.openEnv(lmdbDataPath, mapSize, dbCount)
            .then(() => {
                this._stream = new Stream(this._sys);
                this._meta = new Meta(this._sys, indexDataPath);
                for (let model of [
                    AccessTokenModel,
                    ApiKeyModel,
                    ChannelModel,
                    PackageModel,
                    StreamModel,
                    UserModel
                ]) {
                    this._meta.registerModel(model.name.replace(/Model$/, ''), model);
                    if (_debug) console.log(`Registered model: ${model.name.replace(/Model$/, '')}`);
                }
            });
    }

    get meta() {
        return this._meta;
    }

    get stream() {
        return this._stream;
    }

    get sys() {
        return this._sys;
    }
}