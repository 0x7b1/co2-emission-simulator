import React, { PureComponent } from 'react';
import {
  Card,
  StyledBody,
  StyledAction
} from "baseui/card";
import { styled } from 'baseui';
import { Display4, Paragraph3, Label3 } from 'baseui/typography';
import { FormControl } from 'baseui/form-control';
import { RadioGroup, Radio } from 'baseui/radio';
import { Button, SIZE } from "baseui/button";
import { Slider } from 'baseui/slider';
import { Checkbox, LABEL_PLACEMENT, STYLE_TYPE } from "baseui/checkbox";

const ContainerInfo = styled('div', {
  position: 'absolute',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  top: '20px',
  right: '20px',
  zIndex: 1,
  width: '300px',
});

export default class CardInfo extends PureComponent {
  render() {
    return (
      <ContainerInfo>
        <Card>
          <StyledBody>
            <Display4>Emissions</Display4>
            <Paragraph3>
              Here you can tweak the parameters to fit into the map
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
            <FormControl
            >
              <Checkbox
                checkmarkType={STYLE_TYPE.toggle_round}
                checked={false}
                onChange={console.log}
                labelPlacement={LABEL_PLACEMENT.right}
              >
                Show trips
              </Checkbox>
            </FormControl>
            <Label3>Set the range of time</Label3>
            <Slider
              max={1500}
              step={10}
              value={this.props.filterValue}
              onChange={this.props.filterPath}
            />
            <Button
              size={SIZE.compact}
              onClick={this.props.addNewData}
              overrides={{
                BaseButton: { style: { width: '100%' } }
              }}
            >
              Export
            </Button>
          </StyledAction>
        </Card>
      </ContainerInfo>
    );
  }
}