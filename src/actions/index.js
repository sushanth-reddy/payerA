export const SAVE_CONFIGURATION = 'SAVE_CONFIGURATION';

export function saveConfiguration(configuration){
    return({
          type: SAVE_CONFIGURATION,
          payload: configuration
      })
  }