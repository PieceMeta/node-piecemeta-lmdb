import BaseModel from './base-model';

export default class PackageModel extends BaseModel {
    constructor(payload) {
        super(payload, {

            uuid: {type: String, minLength: 1, index: true},
            user_uuid: {type: String, minLength: 1, index: true},
            title: {type: String, minLength: 1},
            description: String,

            created: Date,
            updated: Date

        });
    }
}