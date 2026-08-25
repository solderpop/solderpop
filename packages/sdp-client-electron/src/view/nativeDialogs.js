import os from 'os';
import R from 'ramda';

const addExtensionsIntoFilters = fileFilter => {
  const extForName = R.compose(R.join(';'), R.map(R.concat('*.')))(
    fileFilter.extensions
  );

  return R.assoc('name', `${fileFilter.name} (${extForName})`, fileFilter);
};
const transformDialogFileFilters = filters =>
  R.compose(
    fn => fn(filters),
    R.cond([
      // We have to reverse an array for MacOS, cause it takes a first extension
      // as a required extension to save a file, so if it is `xodball` — we could
      // not save a Multifile Project.
      [R.equals('darwin'), () => R.reverse],
      // On Linux native dialog extensions does not added automatically into name,
      // as it done in Windows. So do it here:
      [R.equals('linux'), () => R.map(addExtensionsIntoFilters)],
      [R.T, () => R.identity],
    ])
  )(os.platform());

export const getSaveDialogFileFilters = () =>
  transformDialogFileFilters([
    { name: 'Packed SolderPop Project', extensions: ['xodball'] },
    { name: 'Multifile SolderPop Project', extensions: [''] },
  ]);
export const getOpenDialogFileFilters = () =>
  transformDialogFileFilters([
    { name: 'Any SolderPop File', extensions: ['xodball', 'xod', 'xodp'] },
  ]);

export const createSaveDialogOptions = (title, defaultPath, buttonLabel) => ({
  title,
  defaultPath,
  buttonLabel,
  properties: ['createDirectory'],
  message: [
    'To save as packed SolderPop project add ".xodball" extension,',
    'To save as multifile SolderPop project add no extension',
  ].join('\n'),
  filters: getSaveDialogFileFilters(),
});
