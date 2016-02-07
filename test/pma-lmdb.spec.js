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
                    return client.meta.fetch('AccessToken', item.doc.uuid);
                })
                .then((item) => {
                    item.doc.token.should.equal('asdf');
                });
        });

        it('query', () => {
            return client.meta.query('AccessToken', {api_key: fixtures[_type].api_key})
                .then((results) => {
                    results.length.should.equal(1);
                    results[0].doc.api_key.should.equal(fixtures[_type].api_key);
                });
        });

        it('delete', () => {
            return client.meta.del('AccessToken', _item.doc.uuid)
                .then(() => {
                    return client.meta.fetch('AccessToken', _item.doc.uuid);
                })
                .then((item) => {
                    should.equal(item, null);
                });
        });
    });
});