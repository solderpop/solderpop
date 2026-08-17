import R from 'ramda';
import Big from 'big.js';
import { unquote, enquote } from 'sdp-func-tools';
import { BINDABLE_CUSTOM_TYPES, PIN_TYPE, isGenericType } from 'sdp-project';

import BoolWidget from './pinWidgets/BoolPinWidget.jsx';
import NumberWidget from './pinWidgets/NumberPinWidget.jsx';
import PulseWidget from './pinWidgets/PulsePinWidget.jsx';
import StringWidget from './pinWidgets/StringPinWidget.jsx';
import GenericPinWidget from './pinWidgets/GenericPinWidget.jsx';
import ColorPinWidget from './pinWidgets/ColorPinWidget.jsx';
import DisabledInputWidget from './pinWidgets/DisabledInputWidget.jsx';
import DescriptionWidget from './DescriptionWidget.jsx';
import LabelWidget from './LabelWidget.jsx';

import { WIDGET_TYPE } from '../../constants.js';
import { KEYCODE } from '../../../utils/constants.js';
import normalizeByte from '../../../utils/normalizeByte.js';
import normalizeNumber from '../../../utils/normalizeNumber.js';
import normalizePort from '../../../utils/normalizePort.js';
import normalizeGenericValue from '../../../utils/normalizeGenericValue.js';
import normalizeColor from '../../../utils/normalizeColor.js';

function createArrowKeyHandler(bigStep, smallStep) {
  return function arrowKeyHandler(event) {
    event.preventDefault();

    const step = event.shiftKey ? bigStep : smallStep;
    try {
      const bigValue = new Big(event.target.value);
      this.updateValue(bigValue.plus(step).toString(), true);
    } catch (e) {
      // event.target.value is not a number — do nothing
    }
  };
}

const widgetKeyDownHandlers = {
  up: createArrowKeyHandler(1, 0.1),
  down: createArrowKeyHandler(-1, -0.1),
};

const widgetNumberKeysDownHandlers = {
  [KEYCODE.UP]: widgetKeyDownHandlers.up,
  [KEYCODE.DOWN]: widgetKeyDownHandlers.down,
};

const submitOnEnter = {
  [KEYCODE.ENTER]: function enter(event) {
    event.preventDefault();
    this.commit();
  },
};

const submitAndSelectOnEnter = {
  [KEYCODE.ENTER]: function enter(event) {
    event.preventDefault();
    const input = event.target;
    this.commit(() => {
      input.focus();
      input.select();
    });
  },
};

const WIDGET_MAPPING = {
  [WIDGET_TYPE.BOOLEAN]: {
    component: BoolWidget,
    dataType: PIN_TYPE.BOOLEAN,
    commitOnChange: true,
  },
  [WIDGET_TYPE.NUMBER]: {
    component: NumberWidget,
    dataType: PIN_TYPE.NUMBER,
    keyDownHandlers: R.merge(
      widgetNumberKeysDownHandlers,
      submitAndSelectOnEnter
    ),
    normalizeValue: normalizeNumber,
  },
  [WIDGET_TYPE.BYTE]: {
    component: NumberWidget,
    dataType: PIN_TYPE.BYTE,
    keyDownHandlers: submitAndSelectOnEnter,
    normalizeValue: normalizeByte,
  },
  [WIDGET_TYPE.STRING]: {
    component: StringWidget,
    dataType: PIN_TYPE.STRING,
    keyDownHandlers: submitAndSelectOnEnter,
    normalizeValue: R.unless(R.startsWith('='), R.pipe(unquote, enquote)),
  },
  [WIDGET_TYPE.LABEL]: {
    component: LabelWidget,
    dataType: PIN_TYPE.STRING,
    keyDownHandlers: submitOnEnter,
  },
  [WIDGET_TYPE.PULSE]: {
    component: PulseWidget,
    dataType: PIN_TYPE.PULSE,
    commitOnChange: true,
  },
  [WIDGET_TYPE.TEXTAREA]: {
    component: DescriptionWidget,
    dataType: 'string',
  },
  [WIDGET_TYPE.DEAD]: {
    component: DisabledInputWidget,
    dataType: PIN_TYPE.DEAD,
  },
  [WIDGET_TYPE.PORT]: {
    component: NumberWidget,
    dataType: PIN_TYPE.PORT,
    keyDownHandlers: submitAndSelectOnEnter,
    normalizeValue: normalizePort,
  },
  [WIDGET_TYPE.COLOR]: {
    component: ColorPinWidget,
    dataType: BINDABLE_CUSTOM_TYPES.COLOR,
    keyDownHandlers: submitAndSelectOnEnter,
    normalizeValue: normalizeColor,
  },
};

const getGenericTypeWidget = (dataType) => ({
  component: GenericPinWidget,
  dataType,
  keyDownHandlers: submitOnEnter,
  // normalize only almost valid byte values
  normalizeValue: normalizeGenericValue,
});

const getDisabledWidget = (dataType) => ({
  component: DisabledInputWidget,
  props: { dataType },
});

// :: PinType -> WidgetConfig
export const getNodeWidgetConfig = R.cond([
  [isGenericType, getGenericTypeWidget],
  [R.has(R.__, WIDGET_MAPPING), R.prop(R.__, WIDGET_MAPPING)],
  // This must be a custom type then
  [R.T, getDisabledWidget],
]);

export { default as Widget } from './Widget.jsx';

export { default as HintWidget } from './HintWidget.jsx';
export { default as BoolWidget } from './pinWidgets/BoolPinWidget.jsx';
export { default as NumberWidget } from './pinWidgets/NumberPinWidget.jsx';
export { default as PulseWidget } from './pinWidgets/PulsePinWidget.jsx';
export { default as StringWidget } from './pinWidgets/StringPinWidget.jsx';
export { default as GenericPinWidget } from './pinWidgets/GenericPinWidget.jsx';
export { default as DisabledInputWidget } from './pinWidgets/DisabledInputWidget.jsx';
export { default as DescriptionWidget } from './DescriptionWidget.jsx';
export { default as LabelWidget } from './LabelWidget.jsx';
export { default as PulseTweakWidget } from './PulseTweakWidget.jsx';
export { default as NodeSpecializationWidget } from './NodeSpecializationWidget.jsx';
