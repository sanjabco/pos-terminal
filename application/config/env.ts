import Config from 'react-native-config';

// Read configuration compiled into the installed native app.
export const POS_TYPE = Config.POS_TYPE;

export const ENV = {
  POS_TYPE,
  isSepehrPOS: () => POS_TYPE === 'sepehr',
  isDefaultPOS: () => POS_TYPE !== 'sepehr',
};

export default ENV;
