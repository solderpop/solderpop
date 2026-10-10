import React, { useState } from 'react';
import convert from 'color-convert';

import '../src/core/styles/main.scss';
import ColorPicker from '../src/editor/components/ColorPicker/index.jsx';

const hsl = [45, 100, 50];
const hex = convert.hsl.hex(hsl);

const ColorPickerContainer = () => {
  const [color, setColor] = useState({ hsl, hex });
  return <ColorPicker color={color} onChange={setColor} />;
};

export default { title: 'ColorPicker' };

export const Base = () => <ColorPickerContainer />;
