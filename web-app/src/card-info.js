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

const HOUR_MS = 3600000;
const formatTime = (value) => `${(value / HOUR_MS).toFixed(0)}h`;

export default class CardInfo extends PureComponent {
  render() {
    const {
      isLiveMode,
      showTrips,
      showEmissions,
      toggleShowTrips,
      toggleShowEmissions,
      dataRangeValue,
      filterDataRange,
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
                      Show Trips
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      checkmarkType={STYLE_TYPE.toggle}
                      checked={showEmissions}
                      onChange={toggleShowEmissions}
                      labelPlacement={LABEL_PLACEMENT.right}
                    >
                      Show Emissions
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
                  {/* <FormControl label='Set the time resolution'>
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
                  </FormControl> */}
                  {/* <FormControl>
                    <DateRange />
                  </FormControl> */}
                </div>
              )
            }
            <FormControl>
              <CustomTicks />
            </FormControl>
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