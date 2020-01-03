import {combineReducers} from 'redux';
import {Config} from './reducer_config';

const allReducers = combineReducers({
    config:Config,
});

export default allReducers;