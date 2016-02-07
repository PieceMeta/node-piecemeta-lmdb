'use strict';

let chai = require('chai'),
    fs = require('fs-extra');
chai.should();

import PmaLmdb from '../src/pma-lmdb';

describe('PmaLmdb', () => {
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
});