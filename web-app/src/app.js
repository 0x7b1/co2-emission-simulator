import React, { Component } from 'react';
import { StaticMap } from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import { PathLayer } from '@deck.gl/layers';
import { HexagonLayer, HeatmapLayer } from '@deck.gl/aggregation-layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { FormControl } from 'baseui/form-control';
import { Card, StyledBody, StyledAction } from "baseui/card";
import { styled, useStyletron } from 'baseui';
import { Display4, Paragraph3, Label3 } from 'baseui/typography';
import { Checkbox, LABEL_PLACEMENT, STYLE_TYPE } from "baseui/checkbox";
import { Tag, VARIANT } from "baseui/tag";
import { json } from 'd3-fetch';
import { Map, fromJS, List } from 'immutable';
import { Client as Styletron } from 'styletron-engine-atomic';
import { Provider as StyletronProvider } from 'styletron-react';
import { LightTheme, BaseProvider } from 'baseui';
import moment from 'moment';
import hsv2rgb from 'hsv-rgb';

import DateRange from './date-range';
import VehicleFilter from './vehicle-filter';
import dataExample from './data.json';
import trips from './trips.json';

const engine = new Styletron();

const ContainerInfo = styled('div', {
  position: 'absolute',
  display: 'flex',
  justifyContent: 'left',
  alignItems: 'center',
  left: '20px',
  bottom: '20px',
});

const INITIAL_VIEW_STATE = {
  // latitude: 58.30079260885314,
  // longitude: 26.60045353923848,
  latitude: 58.38121869628752,
  longitude: 26.73278172091453,
  zoom: 15,
  pitch: 0,
  bearing: 0
};

const MAP_STYLE = 'mapbox://styles/mapbox/light-v9';
const MAPBOX_TOKEN = 'pk.eyJ1IjoiMHg3YjEiLCJhIjoiY2lwbHMxNnRvMDJkZXU5bmozYjF1a3UyYSJ9.ec73WL0KE8xDc9JFrchXPg';
const BASE = new Date() * 1;
const MS_PER_DAY = 604800000;
const MS_PER_MINUTE = 1000;
const URL_DATA = 'http://localhost:8080/api/vehicles';
const URL_WS = 'ws://localhost:8081/ws';
const mapRange = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;

export default class App extends Component {
  constructor(props) {
    super(props);

    // const timeRange = this._getTimeRange(props.data);
    const timeRange = [Infinity, -Infinity];

    this.state = {
      ws: null,

      histVehData: [],

      liveVehiclePaths: Map(),

      histVehiclePaths: Map(),
      histVehicleData: List(),
      histVehicleDataFiltered: List(),

      lastTime: 0,

      timeRange,
      filterValue: timeRange,

      // hexData: dataExample,

      hoveredObject: null,

      isLiveMode: true,
      showTrips: true,
      showEmissions: false,
    };
  }

  componentDidMount() {
    this.fetchData();
    this.connectWS();
  }

  formatCoordinates(lat, lng) {
    return [Number(lng), Number(lat)];
  }

  formatTimestamp(time = new Date()) {
    // return (time.getTime() - BASE) / 1000;
    return time.getTime();
  }

  // This function groups and updates the path and timestamps of data
  updateVehicleStep = (vehiclePaths, stepTime, lat, lng, veh_id, co2) =>
    vehiclePaths.update(
      veh_id,
      fromJS({ path: [], timestamps: [] }),
      v => v
        .update('path', path => path.push(this.formatCoordinates(lat, lng)))
        .update('timestamps', timestamps => timestamps.push(stepTime))
        .update('co2', () => co2)
    )

  connectWS = () => {
    const ws = new WebSocket(URL_WS);

    ws.onopen = () => this.setState({ ws });
    ws.onmessage = ({ data }) => {
      const { liveVehiclePaths } = this.state;
      const stepTime = this.formatTimestamp();
      const { lat, lng, veh_id, co2 } = JSON.parse(data);

      this.setState({
        liveVehiclePaths: this.updateVehicleStep(liveVehiclePaths, stepTime, lat, lng, veh_id, co2),
        lastTime: stepTime,
      });
    };
    ws.onerror = err => ws.close();
    ws.onclose = e => console.log('DISCONNECTED');
  }

  processHistoryData(min = -Infinity, max = +Infinity) {
    const { histVehData } = this.state;
    let histVehiclePaths = Map();
    let histVehicleData = List();

    histVehData.forEach(({ time, lat, lng, veh_id, co2 }) => {
      const stepTime = this.formatTimestamp(new Date(time));
      const inRange = stepTime > min && stepTime < max;

      if (inRange) {
        histVehiclePaths = this.updateVehicleStep(histVehiclePaths, stepTime, lat, lng, veh_id, co2);
        histVehicleData = histVehicleData.push(Map({
          veh_id,
          time: stepTime,
          coordinates: List(this.formatCoordinates(lat, lng)),
          co2,
        }));
      }
    });

    return [histVehicleData, histVehiclePaths];
  }

  fetchData = async () => {
    const histVehData = await json(URL_DATA);

    if (!histVehData.length) {
      return;
    }

    this.setState({
      histVehData,
    }, () => {
      const [histVehicleData, histVehiclePaths] = this.processHistoryData();
      const timeRange = [histVehicleData.first().get('time'), histVehicleData.last().get('time')];

      this.setState({
        histVehiclePaths,
        histVehicleData,
        histVehicleDataFiltered: histVehicleData,
        filterValue: timeRange,
        timeRange,
      });
    });
  }

  // componentWillReceiveProps(nextProps) {
  //   if (nextProps.data !== this.props.data) {
  //     const timeRange = this._getTimeRange(nextProps.data);
  //     this.setState({ timeRange, filterValue: timeRange });
  //   }
  // }

  // _getTimeRange(data) {
  //   if (!data) {
  //     return null;
  //   }

  //   return data.reduce(
  //     (range, d) => {
  //       const t = d.timestamp / MS_PER_DAY;
  //       range[0] = Math.min(range[0], t);
  //       range[1] = Math.max(range[1], t);

  //       return range;
  //     },
  //     [Infinity, -Infinity]
  //   );
  // }

  _onHover = ({ x, y, object }) => {
    this.setState({ x, y, hoveredObject: object });
  }

  _renderLayers = () => {
    const {
      showTrips,
      showEmissions,
      liveVehiclePaths,
      lastTime,
      isLiveMode,
      histVehiclePaths,
      histVehicleDataFiltered,
    } = this.state;

    return [
      isLiveMode && new TripsLayer({
        id: 'trips-layer',
        data: liveVehiclePaths,
        getPath: ([, d]) => d.get('path').toJS(),
        getTimestamps: ([, d]) => d.get('timestamps').toJS(),
        getColor: [253, 128, 93],
        opacity: 0.8,
        rounded: true,
        trailLength: 100,
        widthMinPixels: 4,
        currentTime: lastTime,
        shadowEnabled: false,
      }),

      !isLiveMode && showTrips && new PathLayer({
        id: 'path-layer',
        data: histVehiclePaths,
        pickable: true,
        getPath: ([, d]) => d.get('path').toJS(),
        // getColor: ([, d]) => hsv2rgb(
        //   100 - mapRange(d.get('co2'), 0, 22427, 0, 100),
        //   100,
        //   100),
        getWidth: ([, d]) => {
          return d.get('path').size / 10;
          // return Math.floor(Math.random() * 6);
          // return mapRange(d.get('path'), 0, 100, 0, 10) * 10;
        },
      }),

      !isLiveMode && showEmissions && new HexagonLayer({
        id: 'hexagon-layer',
        data: histVehicleDataFiltered,
        getPosition: d => d.get('coordinates').toArray(),
        pickable: true,
        extruded: true,
        radius: 5,
        // colorDomain: [1, 100],
        elevationRange: [1, 20],
        elevationScale: 5,
        colorRange: [
          [1, 152, 189, 255],
          [73, 227, 206, 255],
          [216, 254, 181, 255],
          [254, 237, 177, 255],
          [254, 173, 84, 255],
          [209, 55, 78, 255],
        ],
        // getColorWeight: d => d.co2,
        // getElevationWeight: d => 3,
        colorAggregation: 'SUM',
        elevationAggregation: 'SUM',
        transitions: {
          elevationScale: 500,
        },
      }),

      0 && !isLiveMode && showEmissions && new HeatmapLayer({
        id: 'heatmap-layer',
        data: histVehicleDataFiltered,
        radiusPixels: 40,
        colorDomain: [10, 500],
        colorRange: [
          [1, 152, 189, 255],
          [73, 227, 206, 255],
          [216, 254, 181, 255],
          [254, 237, 177, 255],
          [254, 173, 84, 255],
          [209, 55, 78, 255],
        ],
        getPosition: d => d.get('coordinates').toArray(),
        getWeight: d => d.get('co2'),
        intensity: 1,
        threshold: 0.1,
      }),
    ];
  }

  _renderTooltip = () => {
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

  formatTimeLabel(t, format) {
    // const date = new Date(t * MS_PER_MINUTE);
    return moment(t).format(format);
  }

  filterDataRange = ({ value: [min, max] }) => {
    const [histVehicleDataFiltered, histVehiclePaths] = this.processHistoryData(min, max);

    this.setState({
      filterValue: [min, max],
      histVehicleDataFiltered,
      histVehiclePaths,
    });
  }

  renderResolutionFilter(timeSeconds) {
    return (
      <Tag
        onClick={() => {
          const {
            filterValue: [min,],
            timeRange: [, rangeMax],
          } = this.state;

          let max = min + timeSeconds * 1000;
          if (max > rangeMax) {
            max = rangeMax;
          }

          this.filterDataRange({
            value: [min, max],
          });
        }}
        closeable={false}
        variant={VARIANT.outlined}
      >
        {`${timeSeconds}s`}
      </Tag>
    );
  }

  render() {
    const {
      isLiveMode,
      showTrips,
      showEmissions,
      timeRange,
      filterValue,
      histVehData,
    } = this.state;

    console.log('....filterValue', filterValue);

    return (
      <StyletronProvider value={engine}>
        <BaseProvider theme={LightTheme}>
          <DeckGL
            layers={this._renderLayers()}
            initialViewState={INITIAL_VIEW_STATE}
            controller={true}
            pickingRadius={5}
          >
            <StaticMap
              reuseMaps
              mapStyle={MAP_STYLE}
              preventStyleDiffing={true}
              mapboxApiAccessToken={MAPBOX_TOKEN}
            />

            {this._renderTooltip}
          </DeckGL>
          <ContainerInfo>
            <Card>
              <StyledBody>
                <Display4>Emissions</Display4>
                <Paragraph3>
                  This app lets you visualize the emissions of vehicle traffic in two modes: real and past time
            </Paragraph3>
              </StyledBody>
              <StyledAction>
                <FormControl>
                  <Checkbox
                    checkmarkType={STYLE_TYPE.toggle}
                    isError
                    checked={isLiveMode}
                    onChange={({ target: { checked } }) => this.setState({ isLiveMode: checked })}
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
                          onChange={({ target: { checked } }) => this.setState({ showTrips: checked })}
                          labelPlacement={LABEL_PLACEMENT.right}
                        >
                          Show Trips
                    </Checkbox>
                      </FormControl>
                      <FormControl>
                        <Checkbox
                          checkmarkType={STYLE_TYPE.toggle}
                          checked={showEmissions}
                          onChange={({ target: { checked } }) => this.setState({ showEmissions: checked })}
                          labelPlacement={LABEL_PLACEMENT.right}
                        >
                          Show Emissions
                    </Checkbox>
                      </FormControl>
                      {
                        !isLiveMode && histVehData.length && (
                          <div>
                            <FormControl label='Date filter'>
                              <VehicleFilter
                                value={filterValue}
                                min={timeRange[0]}
                                max={timeRange[1]}
                                step={1}
                                formatTimeLabelThumb={t => this.formatTimeLabel(t, '(DD/MM) HH:mm:ss')}
                                formatTimeLabelTick={t => this.formatTimeLabel(t, '(DD/MM) HH:mm:ss')}
                                // step={MS_PER_MINUTE}
                                // formatTimeLabelThumb={t => this.formatTimeLabel(t, 'LT')}
                                // formatTimeLabelTick={t => this.formatTimeLabel(t, 'DD/MM')}
                                onChange={this.filterDataRange}
                              />
                            </FormControl>
                            <FormControl label='Time resolution'>
                              <div>
                                {this.renderResolutionFilter(5)}
                                {this.renderResolutionFilter(10)}
                                {this.renderResolutionFilter(20)}
                              </div>
                            </FormControl>
                            {/* <FormControl caption='Showing 5 hours and 30 minutes'>
                              <DateRange
                                startDate={filterValue[0]}
                                endDate={filterValue[1]}
                                filterDataRange={this.filterDataRange}
                              />
                            </FormControl> */}
                          </div>
                        )
                      }
                    </div>
                  )
                }
              </StyledAction>
            </Card>
          </ContainerInfo>
        </BaseProvider>
      </StyletronProvider>
    );
  }
}