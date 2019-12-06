import React, { PureComponent } from 'react';
import { Card, StyledBody, StyledAction } from "baseui/card";
import { styled, useStyletron } from 'baseui';
import { Display4, Paragraph3, Label3 } from 'baseui/typography';
import { FormControl } from 'baseui/form-control';
import { RadioGroup, Radio } from 'baseui/radio';
import { Button, SIZE } from "baseui/button";
import { Slider, StatefulSlider } from 'baseui/slider';
import { Checkbox, LABEL_PLACEMENT, STYLE_TYPE } from "baseui/checkbox";
import { Tag, VARIANT } from "baseui/tag";

import DateRange from './date-range';

const ContainerInfo = styled('div', {
  position: 'absolute',
  display: 'flex',
  justifyContent: 'left',
  alignItems: 'center',
  left: '20px',
  bottom: '20px',
  // zIndex: 1,
  // width: '100%',

  // position: 'absolute',
  // display: 'flex',
  // justifyContent: 'center',
  // alignItems: 'center',
  // top: '20px',
  // right: '20px',
  // zIndex: 1,
  // width: '300px',
});

const mToKm = (value) => `${(value / 3600000).toFixed(0)}h`;

function CustomTicks() {
  const [value, setValue] = React.useState([4500]);
  const [css, theme] = useStyletron();
  return (
    <Slider
      value={value}
      min={0}
      max={86400000}
      step={3600000}
      onChange={params => {
        if (params.value) {
          setValue(params.value);
        } else {
          setValue([]);
        }
      }}
      overrides={{
        ThumbValue: ({ $value }) => (
          <div
            className={css({
              position: 'absolute',
              top: `-${theme.sizing.scale800}`,
              ...theme.typography.font200,
              backgroundColor: 'transparent',
            })}
          >
            {$value}m
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
            })}
          >
            <div>{mToKm($min)}</div>
            {/* <div>{mToKm(2400)}</div> */}
            {/* <div>{mToKm(3800)}</div> */}
            {/* <div>{mToKm(5200)}</div> */}
            {/* <div>{mToKm(6600)}</div> */}
            <div>{mToKm($max)}</div>
          </div>
        ),
      }}
    />
  );
}

export default class CardInfo extends PureComponent {
  render() {
    const {
      showTrips,
      toggleShowTrips,
      dataRangeValue,
      filterDataRange,
      isLiveMode,
      toggleLiveMode,
    } = this.props;

    return (
      <ContainerInfo>
        <Card>
          <StyledBody>
            <Display4>Emissions</Display4>
            <Paragraph3>
              This app lets you visualize the emissions of vehicle traffic in two modes: real and past time
            </Paragraph3>
          </StyledBody>
          <StyledAction>
            {/* <FormControl
              label="Select the aggregation layer type"
            >
              <RadioGroup>
                <Radio value="red">Heatmap</Radio>
                <Radio value="blue">3d Hexagons</Radio>
              </RadioGroup>
            </FormControl> */}
            {/* <FormControl>
              <Checkbox
                checkmarkType={STYLE_TYPE.toggle_round}
                checked={showTrips}
                onChange={toggleShowTrips}
                labelPlacement={LABEL_PLACEMENT.right}
              >
                Show trips
              </Checkbox>
            </FormControl> */}
            <FormControl>
              <Checkbox
                checkmarkType={STYLE_TYPE.toggle}
                isError
                checked={isLiveMode}
                onChange={toggleLiveMode}
                labelPlacement={LABEL_PLACEMENT.right}
              >
                Live
              </Checkbox>
            </FormControl>
            {
              !isLiveMode && (
                <div>
                  <FormControl>
                    <Checkbox
                      checkmarkType={STYLE_TYPE.toggle}
                      checked={showTrips}
                      onChange={toggleShowTrips}
                      labelPlacement={LABEL_PLACEMENT.right}
                    >
                      Show trips
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Slider
                      max={3000}
                      step={10}
                      value={dataRangeValue}
                      onChange={filterDataRange}
                    />
                  </FormControl>
                  <FormControl label='Set the time resolution'>
                    <div>
                      <Tag
                        onClick={() => alert("asd")}
                        closeable={false}
                        variant={VARIANT.outlined}
                      >
                        30m
                </Tag>
                      <Tag
                        onClick={() => alert("asd")}
                        closeable={false}
                        variant={VARIANT.outlined}
                      >
                        1h
                </Tag>
                      <Tag
                        onClick={() => alert("asd")}
                        closeable={false}
                        variant={VARIANT.outlined}
                      >
                        12h
                </Tag>
                      <Tag
                        onClick={() => alert("asd")}
                        closeable={false}
                        variant={VARIANT.outlined}
                      >
                        24h
                </Tag>
                    </div>
                  </FormControl>
                  {/* <FormControl>
                    <DateRange />
                  </FormControl> */}
                </div>
              )
            }
            {/* <FormControl>
              <CustomTicks />
            </FormControl> */}
            {/* <Button
              size={SIZE.compact}
              onClick={this.props.addNewData}
              overrides={{
                BaseButton: { style: { width: '100%' } }
              }}
            >
              Export
            </Button> */}
          </StyledAction>
        </Card>
      </ContainerInfo>
    );
  }
}