import React, { Component } from 'react';
import { StaticMap } from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import { PathLayer } from '@deck.gl/layers';
import { DataFilterExtension } from '@deck.gl/extensions';
import { HexagonLayer, HeatmapLayer } from '@deck.gl/aggregation-layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { json } from 'd3-fetch';
import { Map, fromJS } from 'immutable';

import { Client as Styletron } from 'styletron-engine-atomic';
import { Provider as StyletronProvider } from 'styletron-react';
import { LightTheme, BaseProvider } from 'baseui';

import CardInfo from './card-info';
import CardLegend from './card-legend';
import RangeInput from './range-input';

import dataExample from './data.json';
import trips from './trips.json';

const engine = new Styletron();

const INITIAL_VIEW_STATE = {
  latitude: 58.30079260885314,
  longitude: 26.60045353923848,
  // latitude: 36.5,
  // longitude: -120,
  zoom: 16.5,
  pitch: 0,
  bearing: 0
};

const MAP_STYLE = 'mapbox://styles/mapbox/light-v9';
const MAPBOX_TOKEN = 'pk.eyJ1IjoiMHg3YjEiLCJhIjoiY2lwbHMxNnRvMDJkZXU5bmozYjF1a3UyYSJ9.ec73WL0KE8xDc9JFrchXPg';
const BASE = new Date() * 1;
const MS_PER_DAY = 604800000; // milliseconds in a week
const URL_DATA = 'http://localhost:8080/api/vehicles';
const URL_WS = 'ws://localhost:8081/ws';
// const dataFilter = new DataFilterExtension({ filterSize: 1 });

export default class App extends Component {
  constructor(props) {
    super(props);

    const timeRange = this._getTimeRange(props.data);

    this.state = {
      ws: null,
      showTrips: true,

      vehicleTrips: Map(), // Live Mode
      vehicleData: Map(),

      lastTime: 0,
      tripsPoints: [],

      timeRange,
      hexData: dataExample,

      vehiclesData: [],
      filteredData: [],
      orig: [],

      filterValue: timeRange,
      hoveredObject: null,
      dataRangeValue: [0, 400],

      isLiveMode: true,
    };
  }

  componentDidMount() {
    // this.fetchData();
    this.connectWS();
  }

  updateVehicleStep = ({ lat, lng, veh_id }) => {
    const { vehicleTrips } = this.state;
    const point = [Number(lng), Number(lat)];
    const step = (new Date() - BASE) / 1000;

    const updatedVehicleTrips = vehicleTrips.update(
      veh_id,
      fromJS({ path: [], timestamps: [] }),
      v => v
        .update('path', path => path.push(point))
        .update('timestamps', timestamps => timestamps.push(step))
    );

    this.setState({
      vehicleTrips: updatedVehicleTrips,
      lastTime: step,
    });
  }

  connectWS = () => {
    const ws = new WebSocket(URL_WS);

    ws.onopen = () => this.setState({ ws });
    ws.onmessage = ({ data }) => this.updateVehicleStep(JSON.parse(data));
    ws.onerror = err => ws.close();
    ws.onclose = e => console.log('DISCONNECTED');
  }

  fetchData = async () => {
    const data = await json(URL_DATA);
    const [vehiclesData, pathsData] = this.convertData(data);

    this.setState({
      vehiclesData,
      filteredData: vehiclesData,
      orig: pathsData,
    });
  }

  convertData(data) {
    // TODO: make this compliant with updateVehicleStep and immutable
    const pathsData = [];
    let vehiclesData = [];

    data.forEach((d) => {
      const path = [];
      const timestamps = [];

      d.rows.forEach(e => {
        path.push([e.lng, e.lat]);
        timestamps.push(new Date(e.time) / MS_PER_DAY);
      });

      pathsData.push({
        path,
        timestamps,
      });

      vehiclesData = vehiclesData.concat(d.rows);
    });

    return [vehiclesData, pathsData];
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

  _onHover = ({ x, y, object }) => {
    this.setState({ x, y, hoveredObject: object });
  }

  _renderLayers = () => {
    const { data } = this.props;
    const {
      filterValue,
      filteredData,
      tripsAcc,
      tripsAcc2,
      showTrips,
      dataRangeValue,
      vehiclesData,
      orig,
      vehicleTrips,
      lastTime,
      isLiveMode,
    } = this.state;
    const trailLength = dataRangeValue[1] - dataRangeValue[0];

    console.log('vehicleTrips', vehicleTrips.toJS())

    return [
      isLiveMode && new TripsLayer({
        id: 'trips-layer',
        data: vehicleTrips,
        getPath: ([, d]) => d.get('path').toJS(),
        getTimestamps: ([, d]) => d.get('timestamps').toJS(),
        getColor: [253, 128, 93],
        opacity: 0.8,
        rounded: true,
        trailLength: 100,
        currentTime: lastTime,
        shadowEnabled: false,
      }),

      !isLiveMode && new PathLayer({
        id: 'path-layer',
        data: vehicleTrips,
        pickable: true,
        getPath: ([, d]) => d.get('path').toJS(),
        // getColor: d => colorToRGBArray(d.color),
        // getWidth: d => 5,
      }),

      !isLiveMode && showTrips && new TripsLayer({
        id: 'trips-layer',
        data: orig,
        getPath: d => d.path,
        getTimestamps: d => d.timestamps,
        getColor: [255, 0, 0],
        opacity: 0.5,
        widthMinPixels: 5,
        rounded: true,
        trailLength,
        currentTime: dataRangeValue[1],
      }),

      0 && !isLiveMode && vehiclesData && new HexagonLayer({
        id: 'hexagon-layer',
        data: vehiclesData,
        getPosition: d => [d.lng, d.lat],
        pickable: true,
        extruded: true,
        radius: 170,
        colorDomain: [1, 100],
        elevationRange: [1, 500],
        elevationScale: 10,
        colorRange: [[1, 152, 189, 255], [73, 227, 206, 255], [216, 254, 181, 255], [254, 237, 177, 255], [254, 173, 84, 255], [209, 55, 78, 255]],
        getColorWeight: d => d.co2,
        getElevationWeight: d => d.co2,
        colorAggregation: 'SUM',
        elevationAggregation: 'SUM',
        transitions: {
          elevationScale: 500,
        },
      }),

      0 && !isLiveMode && vehiclesData && new HeatmapLayer({
        id: 'heatmap-layer',
        data: vehiclesData,
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
        getWeight: d => d.co2,
        intensity: 1,
        threshold: 0.1,
        getPosition: d => [d.lng, d.lat],
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

  _formatLabel(t) {
    const date = new Date(t * MS_PER_DAY);
    return `${date.getUTCFullYear()}/${date.getUTCMonth() + 1}`;
  }

  filterDataRange = ({ value: [min, max] }) => {
    const { vehiclesData } = this.state;

    const filteredData = vehiclesData.filter((d) => {
      const time_ms = new Date(d.time) / MS_PER_DAY;
      const temp =
        time_ms > min &&
        time_ms < max;

      return temp;
    });

    this.setState({
      dataRangeValue: [min, max],
      filteredData,
    });
  }

  render() {
    const {
      showTrips,
      timeRange,
      filterValue,
      dataRangeValue,
      isLiveMode,
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
          {/* {timeRange && (
            <RangeInput
              min={timeRange[0]}
              max={timeRange[1]}
              value={filterValue}
              formatLabel={this._formatLabel}
              onChange={({ value }) => this.setState({ filterValue: value })}
            />
          )} */}
          <CardInfo
            filterDataRange={this.filterDataRange}
            dataRangeValue={dataRangeValue}
            showTrips={showTrips}
            toggleShowTrips={({ target: { checked } }) => this.setState({ showTrips: checked })}
            isLiveMode={isLiveMode}
            toggleLiveMode={({ target: { checked } }) => this.setState({ isLiveMode: checked })}
          />
          {/* <CardLegend /> */}
        </BaseProvider>
      </StyletronProvider>
    );
  }
}