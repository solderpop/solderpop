import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import convert from 'color-convert';
import { debounce } from 'throttle-debounce';

import colorPropType from './colorPropType.js';
import HueCircle from './HueCircle.jsx';
import SatLightBox from './SatLightBox.jsx';

const getNewColor = (newHsl) => ({
  hsl: newHsl,
  hex: `#${convert.hsl.hex(newHsl)}`,
});

const getStateColors = (color) => ({
  color,
  hue: (color.hsl[0] / 360).toFixed(3),
  saturation: (color.hsl[1] / 100).toFixed(3),
  lightness: (color.hsl[2] / 100).toFixed(3),
});

const normalizeInputValue = R.unless(
  R.test(/^0*((\.[0-9]*)?|1)$/),
  R.always(0)
);

class ColorPicker extends React.Component {
  constructor(props) {
    super(props);

    this.state = getStateColors(props.color);

    // Basic handlers
    this.onChange = debounce(10, this.onChange.bind(this));
    this.onHuePickerChange = this.onHuePickerChange.bind(this);
    this.onSaturationLightnessChange =
      this.onSaturationLightnessChange.bind(this);
    // Input
    this.onHueInputChange = this.onHueInputChange.bind(this);
    this.onSaturationInputChange = this.onSaturationInputChange.bind(this);
    this.onLightnessInputChange = this.onLightnessInputChange.bind(this);
    // Commit input changes
    this.onInputKeyDown = this.onInputKeyDown.bind(this);
    this.commitInputs = this.commitInputs.bind(this);
  }

  componentDidUpdate() {
    // Compares against state (not prevProps): color can drift from props
    // between renders (e.g. mid-drag before the debounced onChange lands
    // back as a prop), and this should only resync when the prop is
    // actually out of step with what's currently shown.
    if (!R.equals(this.state.color, this.props.color)) {
      this.setState(getStateColors(this.props.color));
    }
  }

  onChange(newHsl) {
    this.props.onChange(getNewColor(newHsl));
  }

  onSaturationLightnessChange(saturation, lightness) {
    this.onChange([this.state.color.hsl[0], saturation, lightness]);
  }

  onHuePickerChange(degree) {
    this.onChange([degree, this.state.color.hsl[1], this.state.color.hsl[2]]);
  }

  onHueInputChange(event) {
    this.setState({ hue: normalizeInputValue(event.target.value) });
  }

  onSaturationInputChange(event) {
    this.setState({ saturation: normalizeInputValue(event.target.value) });
  }

  onLightnessInputChange(event) {
    this.setState({ lightness: normalizeInputValue(event.target.value) });
  }

  onInputKeyDown(event) {
    if (event.keyCode === 13) {
      this.commitInputs();
    }
  }

  commitInputs() {
    this.onChange([
      this.state.hue * 360,
      this.state.saturation * 100,
      this.state.lightness * 100,
    ]);
  }

  render() {
    const { color, hue, saturation, lightness } = this.state;
    return (
      <div className="ColorPicker">
        <div
          className="ColorPicker_preview"
          style={{
            background: `hsl(${color.hsl[0]}, ${color.hsl[1]}%, ${
              color.hsl[2]
            }%)`,
          }}
        />
        <SatLightBox
          width={110}
          height={70}
          color={color}
          onChange={this.onSaturationLightnessChange}
        />
        <HueCircle
          color={color}
          onChange={this.onHuePickerChange}
          default={0}
          radius={90}
        />
        <div className="ColorPicker_values">
          <div>
            <input
              id={`ColorPicker_Hue_${this.props.widgetId}`}
              value={hue}
              onChange={this.onHueInputChange}
              onBlur={this.commitInputs}
              onKeyDown={this.onInputKeyDown}
            />
            <label htmlFor="ColorPicker_Hue">Hue:</label>
          </div>
          <div>
            <input
              id={`ColorPicker_Saturation_${this.props.widgetId}`}
              value={saturation}
              onChange={this.onSaturationInputChange}
              onBlur={this.commitInputs}
              onKeyDown={this.onInputKeyDown}
            />
            <label htmlFor="ColorPicker_Saturation">Saturation:</label>
          </div>
          <div>
            <input
              id={`ColorPicker_Lightness_${this.props.widgetId}`}
              value={lightness}
              onChange={this.onLightnessInputChange}
              onBlur={this.commitInputs}
              onKeyDown={this.onInputKeyDown}
            />
            <label htmlFor="ColorPicker_Lightness">Lightness:</label>
          </div>
        </div>
      </div>
    );
  }
}

ColorPicker.propTypes = {
  widgetId: PropTypes.string.isRequired,
  color: colorPropType,
  onChange: PropTypes.func,
};

export default ColorPicker;

export const hex2color = (hex) => ({
  hsl: convert.hex.hsl(hex),
  hex,
});
