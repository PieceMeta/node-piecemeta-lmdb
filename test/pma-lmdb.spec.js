'use strict';

let Promise = require('bluebird'),
    path = require('path'),
    chai = require('chai'),
    fs = require('fs-extra'),
    uuid4 = require('uuid4'),
    should = chai.should();

Promise.promisifyAll(fs);

import PmaLmdb from '../src/pma-lmdb';

describe('PmaLmdb', function() {
    this.timeout(10000);
    let client, fixtures = {};

    beforeEach(() => {
        client = new PmaLmdb();
        return client.open('./test/data/lmdb', './test/data/index', 256 * 1024 * 1024, 256)
            .then(() => {
                return fs.readdirAsync('./test/fixtures');
            })
            .map((entry) => {
                return fs.readFileAsync(`./test/fixtures/${entry}`)
                    .then((data) => {
                        fixtures[path.basename(entry, '.json')] = JSON.parse(data);
                    });
            });
    });

    it('open database and return dbi', () => {
        return client.sys.openDb('test')
            .then((dbi) => {
                dbi.constructor.name.should.equal('Dbi');
            });
    });

    describe('AccessToken', () => {
        let _item, _type = 'AccessToken';

        beforeEach(() => {
            return client.meta.create(_type, fixtures[_type])
                .then((item) => {
                    _item = item;
                });
        });

        afterEach(() => {
            return fs.removeAsync('./test/data');
        });

        it('create', () => {
            uuid4.valid(_item.doc.uuid).should.be.true;
        });

        it('fetch', () => {
            return client.meta.fetch(_type, _item.doc.uuid)
                .then((item) => {
                    item.doc.hours_valid.should.equal(1440);
                    item.doc.api_key.should.equal(fixtures[_type].api_key);
                    uuid4.valid(item.doc.uuid).should.be.true;
                });
        });

        it('update', () => {
            return client.meta.update(_type, _item.doc.uuid, {token: 'asdf'})
                .then((item) => {
                    uuid4.valid(item.doc.uuid).should.be.true;
                    return client.meta.fetch(_type, item.doc.uuid);
                })
                .then((item) => {
                    item.doc.token.should.equal('asdf');
                });
        });

        it('query', () => {
            return client.meta.query(_type, {api_key: fixtures[_type].api_key})
                .then((results) => {
                    results.length.should.equal(1);
                    results[0].doc.api_key.should.equal(fixtures[_type].api_key);
                });
        });

        it('delete', () => {
            return client.meta.del(_type, _item.doc.uuid)
                .then(() => {
                    return client.meta.fetch(_type, _item.doc.uuid);
                })
                .then((item) => {
                    should.equal(item, null);
                });
        });

        it('valid', () => {
            _item.isValid().should.be.true;
        });
    });

    describe('Stream', () => {
        let _item, _type = 'Stream';

        beforeEach(() => {
            return client.meta.create(_type, fixtures[_type])
                .then((item) => {
                    _item = item;
                });
        });

        afterEach(() => {
            return fs.removeAsync('./test/data');
        });

        it('create', () => {
            uuid4.valid(_item.doc.uuid).should.be.true;
        });

        it('fetch', () => {
            return client.meta.fetch(_type, _item.doc.uuid)
                .then((item) => {
                    item.doc.title.should.equal(fixtures[_type].title);
                    item.doc.description.should.equal(fixtures[_type].description);
                    uuid4.valid(item.doc.uuid).should.be.true;
                    uuid4.valid(item.doc.channel_uuid).should.be.true;
                    uuid4.valid(item.doc.package_uuid).should.be.true;
                    uuid4.valid(item.doc.user_uuid).should.be.true;
                });
        });

        it('update', () => {
            return client.meta.update(_type, _item.doc.uuid, {title: 'asdf'})
                .then((item) => {
                    uuid4.valid(item.doc.uuid).should.be.true;
                    return client.meta.fetch(_type, item.doc.uuid);
                })
                .then((item) => {
                    item.doc.title.should.equal('asdf');
                });
        });

        it('query', () => {
            return client.meta.query(_type, {channel_uuid: fixtures[_type].channel_uuid})
                .then((results) => {
                    results.length.should.equal(1);
                    results[0].doc.channel_uuid.should.equal(fixtures[_type].channel_uuid);
                });
        });

        it('delete', () => {
            return client.meta.del(_type, _item.doc.uuid)
                .then(() => {
                    return client.meta.fetch(_type, _item.doc.uuid);
                })
                .then((item) => {
                    should.equal(item, null);
                });
        });

        describe('Stream Data', () => {

            let valCount = 3,
                valueLength = 4,
                frameCount = 100000,
                frameSize = valCount * valueLength,
                buffer = new Buffer(frameCount * frameSize),
                writeConfig, readConfig = writeConfig = {
                    from: 0,
                    valueLength: valueLength,
                    valueCount: valCount,
                    format: 'float'
                };

            readConfig.from = 50000;
            readConfig.to = 100000;

            for (let i = 0; i < frameCount; i += 1) {
                for (let v = 0; v < valCount; v += 1) {
                    buffer.writeFloatLE(Math.random(), frameSize * i + v * valueLength);
                }
            }

            it('stores 100000 frames of 3-dimensional float data', () => {
                return client.stream.putStreamData(_item.toObject(), buffer, writeConfig);
            });

            it('stores 100000 frames of 3-dimensional float data, then reads back last 50000', () => {
                return client.stream.putStreamData(_item.toObject(), buffer, writeConfig)
                    .then(() => {
                        return client.stream.getStreamData(_item.toObject(), readConfig);
                    })
                    .then((data) => {
                        data.length.should.equal(frameCount * frameSize / 2);
                    });
            });

            it('stores 100000 frames of 3-dimensional float data, then reads back every 1000th frame', () => {
                readConfig.from = 0;
                readConfig.skip = 1000;
                return client.stream.putStreamData(_item.toObject(), buffer, writeConfig)
                    .then(() => {
                        return client.stream.getStreamData(_item.toObject(), readConfig);
                    })
                    .then((data) => {
                        data.length.should.equal(frameCount * frameSize / 1000);
                    });
            });

            it('stores 100000 frames of 3-dimensional float data, then deletes it', () => {
                return client.stream.putStreamData(_item.toObject(), buffer, writeConfig)
                    .then(() => {
                        return client.stream.delStreamData(_item.toObject());
                    });
            });
        });
    })
});