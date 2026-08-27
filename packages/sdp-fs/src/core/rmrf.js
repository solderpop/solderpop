import fse from 'fs-extra';

const { remove } = fse;

export default (path) =>
  new Promise((resolve, reject) =>
    remove(path, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    })
  );
