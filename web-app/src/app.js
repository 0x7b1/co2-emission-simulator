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
import { DataFilterExtension } from '@deck.gl/extensions';
import moment from 'moment';

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
  latitude: 58.30079260885314,
  longitude: 26.60045353923848,
  zoom: 16.5,
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
// const dataFilter = new DataFilterExtension({ filterSize: 1 });

export default class App extends Component {
  constructor(props) {
    super(props);

    // const timeRange = this._getTimeRange(props.data);
    const timeRange = [Infinity, -Infinity];

    this.state = {
      ws: null,

      liveVehiclePaths: Map(),

      histVehiclePaths: Map(),
      histVehiclePathsFilter: Map(),

      histVehicleData: List(),
      histVehicleDataFilter: List(),

      lastTime: 0,
      tripsPoints: [],

      timeRange,
      hexData: dataExample,

      vehiclesData: [],
      filteredData: [],
      orig: [],

      filterValue: timeRange,
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
  updateVehicleStep = (vehiclePaths, stepTime, lat, lng, veh_id) =>
    vehiclePaths.update(
      veh_id,
      fromJS({ path: [], timestamps: [] }),
      v => v
        .update('path', path => path.push(this.formatCoordinates(lat, lng)))
        .update('timestamps', timestamps => timestamps.push(stepTime))
    )

  connectWS = () => {
    const ws = new WebSocket(URL_WS);

    ws.onopen = () => this.setState({ ws });
    ws.onmessage = ({ data }) => {
      const { liveVehiclePaths } = this.state;
      const stepTime = this.formatTimestamp();
      const { lat, lng, veh_id } = JSON.parse(data);

      this.setState({
        liveVehiclePaths: this.updateVehicleStep(liveVehiclePaths, stepTime, lat, lng, veh_id),
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
        histVehiclePaths = this.updateVehicleStep(histVehiclePaths, stepTime, lat, lng, veh_id);
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
    this.setState({
      histVehData,
    }, () => {
      const [histVehicleData, histVehiclePaths] = this.processHistoryData();
      const timeRange = [histVehicleData.first().get('time'), histVehicleData.last().get('time')];

      this.setState({
        histVehiclePaths,
        histVehicleData,
        histVehicleDataFilter: histVehicleData,
        filterValue: timeRange,
        timeRange,
        // histVehiclePathsFilter: histVehiclePaths,
        // lastTime for historical too??
      });
    });
    // let { 
    //   // histVehiclePaths, 
    //   // histVehicleData,
    //  } = this.state;

    // timeRange[0] = Math.min(timeRange[0], t);
    // timeRange[1] = Math.max(timeRange[1], t);

    // histVehData.forEach(({ time, lat, lng, veh_id, co2 }) => {
    //   const stepTime = this.formatTimestamp(new Date(time));

    //   // const t = new Date(time) / MS_PER_MINUTE;
    //   // const t = new Date(time) * 1;

    //   histVehiclePaths = this.updateVehicleStep(histVehiclePaths, stepTime, lat, lng, veh_id);
    //   histVehicleData = histVehicleData.push(Map({
    //     veh_id,
    //     time: stepTime,
    //     coordinates: List(this.formatCoordinates(lat, lng)),
    //     co2,
    //   }));
    // });

    // const [histVehicleData, histVehiclePaths] = this.processHistoryData();
    // const timeRange = [histVehData.first().get('time'), histVehicleData.last().get('time')];

    // this.setState({
    //   histVehData, // original
    //   histVehiclePaths,
    //   histVehicleData,
    //   histVehicleDataFilter: histVehicleData,
    //   timeRange,
    //   filterValue: timeRange,
    //   // histVehiclePathsFilter: histVehiclePaths,
    //   // lastTime for historical too??
    // });
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.data !== this.props.data) {
      const timeRange = this._getTimeRange(nextProps.data);
      this.setState({ timeRange, filterValue: timeRange });
    }
  }

  getTimeRange(data) {

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
      // histVehicleData,
      // histVehiclePathsFilter,
      histVehiclePaths,
      histVehicleDataFilter,
    } = this.state;

    // console.log('->', histVehicleData.toJS());

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
        currentTime: lastTime,
        shadowEnabled: false,
      }),

      !isLiveMode && showTrips && new PathLayer({
        id: 'path-layer',
        data: histVehiclePaths,
        pickable: true,
        getPath: ([, d]) => d.get('path').toJS(),
        // getColor: d => colorToRGBArray(d.color),
        // getWidth: d => 5,
      }),

      !isLiveMode && showEmissions && new HexagonLayer({
        id: 'hexagon-layer',
        data: histVehicleDataFilter,
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

      !isLiveMode && showEmissions && new HeatmapLayer({
        id: 'heatmap-layer',
        data: histVehicleDataFilter,
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
    // const date = new Date(t);
    return moment(t).format(format);
  }

  filterDataRange = ({ value: [min, max] }) => {
    const { histVehicleData } = this.state;

    // const histVehiclePaths = Map();

    // histVehicleData.filter()

    // const filteredData = vehiclesData.filter((d) => {
    //   const time_ms = new Date(d.time) / MS_PER_DAY;
    //   const temp =
    //     time_ms > min &&
    //     time_ms < max;

    //   return temp;
    // });

    // for (let d of histVehicleData) {
    //   console.log('d', d);
    // }

    const [histVehicleDataFilter, histVehiclePaths] = this.processHistoryData(min, max);

    // histVehicleData.ea(d => {
    //   const time = new Date(d.get('time'));
    //   return time >= min && time <= max;

    //   histVehiclePaths = this.updateVehicleStep(histVehiclePaths, stepTime, lat, lng, veh_id);
    // });

    this.setState({
      // dataRangeValue: [min, max],
      // filteredData,
      // histVehiclePathsFilter,
      filterValue: [min, max],
      histVehicleDataFilter,
      histVehiclePaths,
    });
  }

  renderResolutionFilter(timeMinutes) {
    return (
      <Tag
        onClick={() => alert("asd")}
        closeable={false}
        variant={VARIANT.outlined}
      >
        {timeMinutes}
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
      // dataRangeValue,
    } = this.state;

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
                        !isLiveMode && (
                          <div>
                            <FormControl label='Date filter'>
                              <VehicleFilter
                                value={filterValue}
                                min={timeRange[0]}
                                max={timeRange[1]}
                                // step={MS_PER_MINUTE}
                                step={1}
                                formatTimeLabelThumb={t => this.formatTimeLabel(t, 'LT')}
                                formatTimeLabelTick={t => this.formatTimeLabel(t, 'DD/MM')}
                                onChange={this.filterDataRange}
                              />
                            </FormControl>
                            <FormControl label='Time resolution'>
                              <div>
                                {this.renderResolutionFilter(30)}
                                {this.renderResolutionFilter(60)}
                                {this.renderResolutionFilter(60 * 12)}
                                {this.renderResolutionFilter(60 * 24)}
                              </div>
                            </FormControl>
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