import {
  call,
  map,
  invokeMap,
  reduce,
  isBoolean,
  indexOf,
  sortBy,
  mapKeys
} from 'lodash';
import * as joi from 'joi';

export type OptionsModel = {
  [key: string]: {
    type: 'number' | 'array' | 'string';
    options: {
      [key: string]: any;
    };
  };
};

const generateJoiScheme = (rootKeys: string[], options: OptionsModel) => {
  const schema = reduce(
    rootKeys, // ['id','username']
    (prevKey, currKey) => {
      // currKey: 'id'
      const optionKeys = Object.keys(options[currKey].options);

      const joiScheme = reduce(
        optionKeys,
        (prevVal, optionKey) => {
          const optionValue = options[currKey].options[optionKey];
          const optionGotArgs = !isBoolean(optionValue);
          const optionEnabled = optionValue === true;

          if (optionGotArgs) {
            return prevVal[optionKey](optionValue);
          } else if (optionEnabled) {
            return prevVal[optionKey]();
          }
          return prevKey;
        },
        joi[options[currKey].type]()
      );
      return { ...prevKey, [currKey]: joiScheme };
    },
    {}
  );
  return schema;
};

export function validator(options: OptionsModel): any {
  const rootKeys = Object.keys(options);
  const schema = generateJoiScheme(rootKeys, options);

  return (ctx, next) => {
    const result = joi.validate(ctx.request.body, schema);

    if (!result.error) {
      return next();
    }

    ctx.body = result.error;
  };
}