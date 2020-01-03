import {SAVE_CONFIGURATION} from '../actions/index';
import config_default from '../globalConfiguration.json';

export const Config = function(state = {}, action){
	switch(action.type){ 
		case SAVE_CONFIGURATION:
			console.log("in configuration save",action);
			state = action.payload;
			return {...state}
		default:
			state = config_default;
	    return state;
		}
}
