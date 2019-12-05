import React, { Component } from 'react';
import { StaticMap } from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { DataFilterExtension } from '@deck.gl/extensions';
import { HexagonLayer, HeatmapLayer } from '@deck.gl/aggregation-layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import sample from 'lodash/sample';
import flatMap from 'lodash/flatMap';
import groupBy from 'lodash/groupBy';
import { json } from 'd3-fetch';

import { Client as Styletron } from 'styletron-engine-atomic';
import { Provider as StyletronProvider } from 'styletron-react';
import { LightTheme, BaseProvider } from 'baseui';

import RangeInput from './range-input';
import CardInfo from './card-info';
import CardLegend from './card-legend';

import dataExample from './data.json';
import trips from './trips.json';

const engine = new Styletron();

const INITIAL_VIEW_STATE = {
  latitude: 36.5,
  longitude: -120,
  zoom: 5.5,
  pitch: 0,
  bearing: 0
};

const MAPBOX_TOKEN = 'pk.eyJ1IjoiMHg3YjEiLCJhIjoiY2lwbHMxNnRvMDJkZXU5bmozYjF1a3UyYSJ9.ec73WL0KE8xDc9JFrchXPg';
const BASE = 1554772579000;
const MS_PER_DAY = 8.64e7; // milliseconds in a day
// const URL_DATA = 'http://localhost:8080/api/mock';
const URL_DATA = 'http://localhost:8080/api/vehicles';
const dataFilter = new DataFilterExtension({ filterSize: 1 });

export default class App extends Component {
  constructor(props) {
    super(props);

    const timeRange = this._getTimeRange(props.data);

    this.state = {
      timeRange,
      hexData: dataExample,

      wholeData: [],
      filteredData: [],
      orig: [],

      filterValue: timeRange,
      hoveredObject: null,
      pathFilterValue: [0, 100],
    };
  }

  componentDidMount() {
    this.fetchData();
  }

  fetchData = async () => {
    const data = await json(URL_DATA);
    const [vehiclesData, pathsData] = this.convertData(data);
    console.log('vehiclesData', vehiclesData);
    console.log('pathsData', pathsData);

    this.setState({
      wholeData: vehiclesData,
      filteredData: vehiclesData,
      // orig: data,
      orig: pathsData,
    }, () => {
      // setTimeout(this.fetchData, 1000);
    });
  }

  convertData(data) {
    const paths = [];
    let vehInfo = [];

    data.forEach((d) => {
      // paths.push(d.rows.map(p => ({
      //   path: [p.lng, p.lat],
      //   timestamps: new Date(p.time) - BASE,
      // })));
      const path = [];
      const timestamps = [];
      d.rows.forEach(e => {
        path.push([e.lng, e.lat]);
        timestamps.push(new Date(e.time) - BASE);
      });

      paths.push({
        path,
        timestamps,
      });
      // paths.push({
      //   path: d.rows.map(p => [p.lng, p.lat]),
      //   timestamps: d.rows.map(p => new Date(p.time) - BASE),
      // });

      vehInfo = vehInfo.concat(d.rows);
    });

    // return flatMap(data, e => e.rows);
    return [vehInfo, paths];
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
    const { filterValue, pathFilterValue, filteredData, wholeData, orig } = this.state;
    const trail = pathFilterValue[1] - pathFilterValue[0];
    // const temp = flatMap(trips, e => e.waypoints);
    // const groupedData = groupBy(wholeData, 'veh_id');
    console.log('orig', orig);

    return [
      new TripsLayer({
        id: 'trips-layer',
        data: orig,
        getPath: d => d.path,
        getTimestamps: d => d.timestamps,

        // getPath: d => {
        //   console.log('---', d);
        //   const tmp = d.rows.map(r => [r.lng, r.lat]);
        //   console.log('--->', tmp);
        //   return tmp; // [[-122.41316, 7.77749], [-122.41316, 7.77749], ...]
        // },
        // getTimestamps: d => {
        //   console.log('==', d)
        //   const tmp = d.rows.map(r => new Date(r.time) - BASE);
        //   console.log('==>', tmp)
        //   return tmp; // [0, 10, 20, ...]
        // },
        // getPath: d => d.waypoints.map(p => p.coordinates),
        // getTimestamps: d => new Date(d.time) - BASE,
        // getTimestamps: d => d.waypoints.map(p => new Date(p.time) - BASE),
        // getTimestamps: d => d.waypoints.map(p => p.timestamp - BASE),
        getColor: [255, 0, 0],
        opacity: 0.5,
        widthMinPixels: 5,
        rounded: true,
        trailLength: trail,
        currentTime: pathFilterValue[1],
      }),

      0 && wholeData && new HexagonLayer({
        id: 'hexagon-layer',
        data: wholeData,
        // data: filteredData,
        pickable: true,
        extruded: true,
        radius: 170, // 70
        colorDomain: [1, 100],
        elevationRange: [1, 500],
        elevationScale: 10,
        colorRange: [[1, 152, 189, 255], [73, 227, 206, 255], [216, 254, 181, 255], [254, 237, 177, 255], [254, 173, 84, 255], [209, 55, 78, 255]],
        getColorWeight: d => d.co2,
        getElevationWeight: d => d.co2,
        colorAggregation: 'SUM',
        elevationAggregation: 'SUM',
        getPosition: d => [d.lng, d.lat],
        transitions: {
          elevationScale: 500,
        },
      }),

      0 && wholeData && new HeatmapLayer({
        id: 'heatmap-layer',
        data: wholeData,
        radiusPixels: 40, // 70
        colorDomain: [10, 500],
        colorRange: [[1, 152, 189, 255], [73, 227, 206, 255], [216, 254, 181, 255], [254, 237, 177, 255], [254, 173, 84, 255], [209, 55, 78, 255]],
        getWeight: d => d.co2,
        intensity: 1,
        threshold: 0.1,
        getPosition: d => [d.lng, d.lat],
      }),

      !data &&
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

  addNewData = () => {
    const newData = this.state.hexData;

    this.setState({
      hexData: newData.concat(sample(newData)),
    });
  }

  filterPath = ({ value }) => {
    const { wholeData } = this.state;
    const filteredData = wholeData.filter(d =>
      Date(d.time) > BASE + value[0] &&
      Date(d.time) < BASE + value[1]);

    this.setState({
      pathFilterValue: value,
      filteredData,
    });
  }

  render() {
    const { mapStyle = 'mapbox://styles/mapbox/light-v9' } = this.props;
    const { timeRange, filterValue, pathFilterValue } = this.state;

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
            // addNewData={this.addNewData}
            filterPath={this.filterPath}
            filterValue={pathFilterValue}
          />
          <CardLegend />
        </BaseProvider>
      </StyletronProvider>
    );
  }
}