import R from 'ramda';
import fse from 'fs-extra';

const { curry } = R;

export default curry(
  (source, target) =>
    new Promise((resolve, reject) => {
      fse.copy(source, target, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    })
);
