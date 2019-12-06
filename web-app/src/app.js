import React, { Component } from 'react';
import { StaticMap } from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { DataFilterExtension } from '@deck.gl/extensions';
import { HexagonLayer, HeatmapLayer } from '@deck.gl/aggregation-layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { json } from 'd3-fetch';
import { Map, fromJS } from 'immutable';

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
  latitude: 58.30079260885314,
  longitude: 26.60045353923848,
  // latitude: 36.5,
  // longitude: -120,
  zoom: 16.5,
  pitch: 0,
  bearing: 0
};

const MAPBOX_TOKEN = 'pk.eyJ1IjoiMHg3YjEiLCJhIjoiY2lwbHMxNnRvMDJkZXU5bmozYjF1a3UyYSJ9.ec73WL0KE8xDc9JFrchXPg';
// const BASE = 1554772579000;
// const BASE = 1575628392112;
const BASE = new Date() * 1;
// const MS_PER_DAY = 8.64e7; // milliseconds in a day
const MS_PER_DAY = 604800000; // milliseconds in a week
const URL_DATA = 'http://localhost:8080/api/vehicles';
const URL_WS = 'ws://localhost:8081/ws';
const dataFilter = new DataFilterExtension({ filterSize: 1 });

const guardadoPaths = [
  [26.60049192587654, 58.3007927287464],
  [26.600568699153587, 58.30079296849834],
  [26.600683859071477, 58.30079332803988],
  [26.600837405632994, 58.3007938072673],
  [26.601029338841844, 58.30079440604243],
  [26.60125965870265, 58.30079512419244],
  [26.60129758364009, 58.30083629668888],
  [26.601296730007675, 58.30091219740722],
  [26.601295649093796, 58.30100830629835],
  [26.601294340894047, 58.301124623361396],
];

const guardadoTimes = [
  10,
  20,
  30,
  40,
  50,
  60,
  70,
  80,
  90,
  100,
];

export default class App extends Component {
  constructor(props) {
    super(props);

    const timeRange = this._getTimeRange(props.data);

    this.state = {
      ws: null,
      showTrips: true,

      tripsAcc2: [{
        path: [
          [26.60045353923848, 58.30079260885314],
          // [26.60049192587654, 58.3007927287464],
          // [26.600568699153587, 58.30079296849834],
          // [26.600683859071477, 58.30079332803988],
          // [26.600837405632994, 58.3007938072673],
          // [26.601029338841844, 58.30079440604243],
          // [26.60125965870265, 58.30079512419244],
          // [26.60129758364009, 58.30083629668888],
          // [26.601296730007675, 58.30091219740722],
          // [26.601295649093796, 58.30100830629835],
          // [26.601294340894047, 58.301124623361396],
        ],
        timestamps: [
          0,
          // 10,
          // 20,
          // 30,
          // 40,
          // 50,
          // 60,
          // 70,
          // 80,
          // 90,
          // 100,
        ]
      }],
      tripsAcc: [{ path: [], timestamps: [] }],

      vehicleTrips: Map(),

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
    this.fetchData();
    this.connectWS();

    // const int = setInterval(() => {
    //   const { tripsAcc2 } = this.state;
    //   const lastTime = guardadoTimes.shift();
    //   const lastPos = guardadoPaths.shift();
    //   const newArr = Array.from(tripsAcc2);

    //   console.log('lastTime', lastTime);
    //   console.log('lastPos', lastPos);

    //   newArr[0].path.push(lastPos);
    //   newArr[0].timestamps.push(lastTime);

    //   console.log('TRIGERED!', tripsAcc2);
    //   if (!guardadoPaths.length) clearInterval(int);

    //   this.setState({
    //     lastTime: lastTime,
    //     tripsAcc2: newArr,
    //   });
    // }, 1500);

  }

  connectWS = () => {
    const { tripsAcc } = this.state;
    const ws = new WebSocket(URL_WS);

    ws.onopen = () => {
      console.log('WS CONNECTED');
      this.setState({ ws });
    };

    // console.log('!!!!!!vehicleTrips', vehicleTrips.toJS());

    ws.onmessage = ({ data }) => {
      const { vehicleTrips } = this.state;
      const { lat, lng, veh_id } = JSON.parse(data);
      const point = [Number(lng), Number(lat)];
      const step = (new Date() - BASE) / 1000;

      // vehicleTrips.update(veh_id, v => {
      //   v.path.push(point);
      //   v.timestamps.push(step);
      // })

      // console.log('-data', data);
      // const newArr = Array.from(tripsAcc);
      // newArr[0].path.push(point);
      // newArr[0].timestamps.push(step);


      // const updatedVehicleTrips = vehicleTrips
      //   .update([veh_id, 'path'], path => path.push(point))
      //   .update([veh_id, 'timestamps'], timestamps => timestamps.push(step));

      console.log('!vehicleTrips', vehicleTrips.toJS());
      const updatedVehicleTrips = vehicleTrips.update(
        veh_id,
        fromJS({ path: [], timestamps: [] }),
        v => v
          .update('path', path => path.push(point))
          .update('timestamps', timestamps => timestamps.push(step))
      );

      this.setState({
        // tripsAcc: newArr,

        lastTime: step,
        vehicleTrips: updatedVehicleTrips,
      });
    };

    ws.onclose = e => {
      console.log('DISCONNECTED');
    };

    ws.onerror = err => {
      console.error(err.message);
      ws.close();
    };
  }

  fetchData = async () => {
    const data = await json(URL_DATA);
    const [vehiclesData, pathsData] = this.convertData(data);

    console.log('vehiclesData', vehiclesData);
    console.log('pathsData', pathsData);

    this.setState({
      vehiclesData,
      filteredData: vehiclesData,
      orig: pathsData,
    });
  }

  convertData(data) {
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

    // return flatMap(data, e => e.rows);
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
      showTrips,
      filterValue,
      dataRangeValue,
      filteredData,
      vehiclesData,
      tripsAcc,
      tripsAcc2,
      orig,
      vehicleTrips,
      lastTime,

    } = this.state;
    const trailLength = dataRangeValue[1] - dataRangeValue[0];
    console.log('WIL', vehicleTrips.toJS());

    return [
      new TripsLayer({
        id: 'trips-layer',
        data: vehicleTrips,
        getPath: ([, d]) => {
          console.log('-----d', d);
          console.log('->d', d.get('path').toJS());
          return d.get('path').toJS();
        },
        getTimestamps: ([, d]) => {
          console.log('->t', d.get('timestamps').toJS());
          return d.get('timestamps').toJS();
        },
        getColor: [253, 128, 93],
        opacity: 0.8,
        rounded: true,
        trailLength: 2000,
        currentTime: lastTime,
        shadowEnabled: false,
      }),

      0 && showTrips && new TripsLayer({
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

      0 && vehiclesData && new HexagonLayer({
        id: 'hexagon-layer',
        data: vehiclesData,
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
        getPosition: d => [d.lng, d.lat],

        // extensions: [dataFilter],
        // getFilterValue: d => {
        //   console.log('d', d);
        //   const temp = new Date(d.time) / MS_PER_DAY;
        //   console.log('-ENTERS', temp);
        //   return temp;
        // },
        // filterRange: [dataRangeValue[0], dataRangeValue[1]],
        // filterSoftRange: [
        //   dataRangeValue[0] * 0.9 + dataRangeValue[1] * 0.1,
        //   dataRangeValue[0] * 0.1 + dataRangeValue[1] * 0.9
        // ],

        transitions: {
          elevationScale: 500,
        },
      }),

      0 && vehiclesData && new HeatmapLayer({
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

      0 && !data &&
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

  filterDataRange = ({ value: [min, max] }) => {
    const { vehiclesData } = this.state;
    console.log('min, max', min, max);

    const filteredData = vehiclesData.filter((d) => {
      console.log('->', d.time);

      const time_ms = new Date(d.time) / MS_PER_DAY;
      console.log('->time_ms', time_ms);
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

  toggleShowTrips = (e) => {
    console.log('--->', e.target.checked);
    const { showTrips } = this.state;

    this.setState({
      showTrips: e.target.checked,
    });
  }

  render() {
    const { mapStyle = 'mapbox://styles/mapbox/light-v9' } = this.props;
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
          <button onClick={() => {
            const { tripsAcc2 } = this.state;
            const newPos = guardadoPaths.shift();
            const newTime = guardadoTimes.shift();

            const updatedArray = Array.from(tripsAcc2);

            updatedArray[0].path.push(newPos);
            updatedArray[0].timestamps.push(newTime);

            this.setState({
              lastTime: newTime,
              tripsAcc2: updatedArray,
            });
          }} style={{ zIndex: 10000, position: 'absolute' }}>Hello</button>
          <CardInfo
            // addNewData={this.addNewData}
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