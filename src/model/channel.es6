import BaseModel from './base-model';

export default class ChannelModel extends BaseModel {
    constructor(payload) {
        super(payload, {

            uuid: {type: 'string', index: true, unique: true},
            user_uuid: {type: 'string', index: true, required: true},
            package_uuid: {type: 'string', index: true, required: true},
            title: {type: 'string', required: true},
            description: {type: 'string'},

            created: 'date',
            updated: 'date'

        });
    }
}