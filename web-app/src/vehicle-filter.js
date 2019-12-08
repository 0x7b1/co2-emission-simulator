import * as React from 'react';
import { Slider } from 'baseui/slider';
import { useStyletron } from 'baseui';

const mToKm = (value) => `${(value / 1000).toFixed(1)}km`;

const MS_PER_SECOND = 1000;

function VehicleFilter(props) {
  const {
    value,
    min,
    max,
    step,
    onChange,
    formatTimeLabelThumb,
    formatTimeLabelTick,
  } = props;
  const [css, theme] = useStyletron();

  return (
    <Slider
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={onChange}
      overrides={{
        ThumbValue: ({ $value, $thumbIndex }) => (
          <div
            className={css({
              position: 'absolute',
              top: `-${theme.sizing.scale800}`,
              backgroundColor: 'transparent',
              ...theme.typography.font100,
            })}
          >
            {formatTimeLabelThumb($value[$thumbIndex])}
          </div>
        ),
        TickBar: ({ $min, $max }) => (
          <div
            className={css({
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingRight: theme.sizing.scale600,
              paddingLeft: theme.sizing.scale600,
              paddingBottom: theme.sizing.scale400,
              ...theme.typography.font100,
            })}
          >
            <div>{formatTimeLabelTick($min)}</div>
            <div>{formatTimeLabelTick($min + MS_PER_SECOND * 1)}</div>
            <div>{formatTimeLabelTick($max)}</div>
          </div>
        ),
      }}
    />
  );
}

export default VehicleFilter;
