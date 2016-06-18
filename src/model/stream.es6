import BaseModel from './base-model';

export default class StreamModel extends BaseModel {
    constructor(payload) {
        super(payload, {

            uuid: {type: 'string', index: true, unique: true},
            channel_uuid: {type: 'string', index: true, required: true},
            package_uuid: {type: 'string', index: true, required: true},
            user_uuid: {type: 'string', index: true, required: true},
            title: {type: 'string', required: true},
            description: {type: 'string'},
            group: {type: 'string'},
            frameCount: {type: 'number'},
            labels: {type: 'array', required: true},
            timeAtIndex: {type: 'number'},
            format: {type: 'string'},
            fps: {type: 'number', required: true},

            created: 'date',
            updated: 'date'

        });
    }
}