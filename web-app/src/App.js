import React, { Component, Fragment } from 'react';
import { StaticMap } from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { DataFilterExtension } from '@deck.gl/extensions';

import { Client as Styletron } from 'styletron-engine-atomic';
import { Provider as StyletronProvider } from 'styletron-react';
import { LightTheme, BaseProvider, styled } from 'baseui';
import { Display4, Paragraph3, Label3 } from 'baseui/typography';
import { FormControl } from 'baseui/form-control';
import { RadioGroup, Radio } from 'baseui/radio';
import {
  Card,
  StyledBody,
  StyledAction
} from "baseui/card";
import { Button } from "baseui/button";


import RangeInput from './range-input';

const engine = new Styletron();

const Container2 = styled('div', {
  position: 'absolute',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  top: '20px',
  right: '20px',
  zIndex: 1,
  width: '300px',
});

const MAPBOX_TOKEN = 'pk.eyJ1IjoiMHg3YjEiLCJhIjoiY2lwbHMxNnRvMDJkZXU5bmozYjF1a3UyYSJ9.ec73WL0KE8xDc9JFrchXPg';

const INITIAL_VIEW_STATE = {
  latitude: 36.5,
  longitude: -120,
  zoom: 5.5,
  pitch: 0,
  bearing: 0
};

const MS_PER_DAY = 8.64e7; // milliseconds in a day

const dataFilter = new DataFilterExtension({ filterSize: 1 });

export default class App extends Component {
  constructor(props) {
    super(props);

    const timeRange = this._getTimeRange(props.data);

    this.state = {
      timeRange,
      filterValue: timeRange,
      hoveredObject: null
    };
    this._onHover = this._onHover.bind(this);
    this._renderTooltip = this._renderTooltip.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.data !== this.props.data) {
      const timeRange = this._getTimeRange(nextProps.data);
      this.setState({ timeRange, filterValue: timeRange });
    }
  }

  _getTimeRange(data) {
    if (!data) {
      return null;
    }
    return data.reduce(
      (range, d) => {
        const t = d.timestamp / MS_PER_DAY;
        range[0] = Math.min(range[0], t);
        range[1] = Math.max(range[1], t);
        return range;
      },
      [Infinity, -Infinity]
    );
  }

  _onHover({ x, y, object }) {
    this.setState({ x, y, hoveredObject: object });
  }

  _renderLayers() {
    const { data } = this.props;
    const { filterValue } = this.state;

    return [
      data &&
      new ScatterplotLayer({
        id: 'earthquakes',
        data,
        opacity: 0.8,
        radiusScale: 100,
        radiusMinPixels: 1,
        wrapLongitude: true,

        getPosition: d => [d.longitude, d.latitude, -d.depth * 1000],
        getRadius: d => Math.pow(2, d.magnitude),
        getFillColor: d => {
          const r = Math.sqrt(Math.max(d.depth, 0));
          return [255 - r * 15, r * 5, r * 10];
        },

        getFilterValue: d => d.timestamp / MS_PER_DAY, // in days
        filterRange: [filterValue[0], filterValue[1]],
        filterSoftRange: [
          filterValue[0] * 0.9 + filterValue[1] * 0.1,
          filterValue[0] * 0.1 + filterValue[1] * 0.9
        ],
        extensions: [dataFilter],

        pickable: true,
        onHover: this._onHover
      })
    ];
  }

  _renderTooltip() {
    const { x, y, hoveredObject } = this.state;
    return (
      hoveredObject && (
        <div className="tooltip" style={{ top: y, left: x }}>
          <div>
            <b>Time: </b>
            <span>{new Date(hoveredObject.timestamp).toUTCString()}</span>
          </div>
          <div>
            <b>Magnitude: </b>
            <span>{hoveredObject.magnitude}</span>
          </div>
          <div>
            <b>Depth: </b>
            <span>{hoveredObject.depth} km</span>
          </div>
        </div>
      )
    );
  }

  _formatLabel(t) {
    const date = new Date(t * MS_PER_DAY);
    return `${date.getUTCFullYear()}/${date.getUTCMonth() + 1}`;
  }

  render() {
    const { mapStyle = 'mapbox://styles/mapbox/light-v9' } = this.props;
    const { timeRange, filterValue } = this.state;

    return (
      <StyletronProvider value={engine}>
        <BaseProvider theme={LightTheme}>
          <DeckGL
            layers={this._renderLayers()}
            initialViewState={INITIAL_VIEW_STATE}
            controller={true}
          >
            <StaticMap
              reuseMaps
              mapStyle={mapStyle}
              preventStyleDiffing={true}
              mapboxApiAccessToken={MAPBOX_TOKEN}
            />

            {this._renderTooltip}
          </DeckGL>

          {timeRange && (
            <RangeInput
              min={timeRange[0]}
              max={timeRange[1]}
              value={filterValue}
              formatLabel={this._formatLabel}
              onChange={({ value }) => this.setState({ filterValue: value })}
            />
          )}
          <Container2>
            <Card>
              <StyledBody>
                <Display4>Emissions</Display4>
                <Paragraph3>
                  Proin ut dui sed metus pharetra hend rerit vel non
                  mi. Nulla ornare faucibus ex, non facilisis nisl.
                </Paragraph3>
                <Label3>
                  mi. Nulla ornare faucibus ex, non facilisis nisl.
                </Label3>
              </StyledBody>
              <StyledAction>
                <FormControl
                  label="RadioGroup label"
                  caption="RadioGroup caption"
                >
                  <RadioGroup>
                    <Radio value="red">Red</Radio>
                    <Radio value="green">Green</Radio>
                    <Radio value="blue">Blue</Radio>
                  </RadioGroup>
                </FormControl>
                <Button
                  overrides={{
                    BaseButton: { style: { width: '100%' } }
                  }}
                >
                  Button Label
                </Button>
              </StyledAction>
            </Card>
          </Container2>
        </BaseProvider>
      </StyletronProvider>
    );
  }
}