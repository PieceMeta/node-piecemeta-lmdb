'use strict';

let chai = require('chai'),
    fs = require('fs-extra'),
    uuid4 = require('uuid4'),
    should = chai.should();

import PmaLmdb from '../src/pma-lmdb';

describe('PmaLmdb', function() {
    this.timeout(10000);
    let client;

    beforeEach(() => {
        client = new PmaLmdb();
        return client.open('./test/data/lmdb', './test/data/index', 256 * 1024 * 1024, 256);
    });

    afterEach((done) => {
        fs.remove('./test/data', done);
    });

    it('opens a database and returns a Dbi', () => {
        return client.sys.openDb('test')
            .then((dbi) => {
                dbi.constructor.name.should.equal('Dbi');
            });
    });

    it('creates, fetches, updates and deletes an AccessToken', () => {
        return client.meta.create('AccessToken', {})
            .then((token) => {
                token.doc.hours_valid.should.equal(1440);
                uuid4.valid(token.doc.uuid).should.be.true;
                return client.meta.fetch('AccessToken', token.doc.uuid);
            })
            .then((token) => {
                token.doc.hours_valid.should.equal(1440);
                uuid4.valid(token.doc.uuid).should.be.true;
                return client.meta.update('AccessToken', token.doc.uuid, { token: 'asdf' })
                    .then((token) => {
                        return client.meta.query('AccessToken', { token: ['asdf'] });
                    });
            })
            .then((results) => {
                results.length.should.equal(1);
                let token = results[0];
                token.doc.token.should.equal('asdf');
                return client.meta.del('AccessToken', token.doc.uuid)
                    .then(() => {
                        return client.meta.fetch('AccessToken', token.doc.uuid);
                    });
            })
            .then((token) => {
                should.equal(token, null);
            });
    });
});