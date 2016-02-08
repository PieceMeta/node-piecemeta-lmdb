import MetaController from './controller/meta';
import SearchController from './controller/search';
import StreamController from './controller/stream';
import SysController from './controller/sys';

import AccessTokenModel from './model/access-token';
import ApiKeyModel from './model/api-key';
import ChannelModel from './model/channel';
import PackageModel from './model/package';
import StreamModel from './model/stream';
import UserModel from './model/user';

var _debug = typeof v8debug === 'object';

export default class PiecemetaLmdb {
    constructor() {
        this._sys = new SysController();
    }

    open(lmdbDataPath, indexDataPath, mapSize, dbCount) {
        return this._sys.openEnv(lmdbDataPath, mapSize, dbCount)
            .then(() => {
                this._stream = new StreamController(this._sys);
                this._meta = new MetaController(this._sys, indexDataPath);
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