import React, { Component, Fragment } from 'react';
import { StaticMap } from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import { PathLayer, IconLayer } from '@deck.gl/layers';
import { HexagonLayer, HeatmapLayer } from '@deck.gl/aggregation-layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { FormControl } from 'baseui/form-control';
import { Card, StyledBody, StyledAction } from "baseui/card";
import { styled, useStyletron } from 'baseui';
import {
  Display4,
  Label1,
  Label2,
  Label3,
  Label4,
  Paragraph1,
  Paragraph2,
  Paragraph3,
  Paragraph4,
} from 'baseui/typography';
import { Checkbox, LABEL_PLACEMENT, STYLE_TYPE } from "baseui/checkbox";
import { Tag, VARIANT } from "baseui/tag";
import { json } from 'd3-fetch';
import { Map, fromJS, List } from 'immutable';
import { Client as Styletron } from 'styletron-engine-atomic';
import { Provider as StyletronProvider } from 'styletron-react';
import { LightTheme, BaseProvider } from 'baseui';
import moment from 'moment';
import hsv2rgb from 'hsv-rgb';
import { StyledLink as Link } from 'baseui/link';
import { Button } from 'baseui/button';
import {
  HeaderNavigation,
  ALIGN,
  StyledNavigationItem as NavigationItem,
  StyledNavigationList as NavigationList,
} from 'baseui/header-navigation';
import { ListItem, ARTWORK_SIZES, ListItemLabel } from "baseui/list";
import { Check } from "baseui/icon";

import VehicleFilter from './vehicle-filter';
import CardLegend from './card-legend';
import DateRange from './date-range';
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

  // latitude: 58.38121869628752,
  // longitude: 26.73278172091453,

  latitude: 43.72876951717807,
  longitude: 7.381480783579958,

  zoom: 15,
  pitch: 0,
  bearing: 0
};

const MAP_STYLE = 'mapbox://styles/mapbox/light-v9';
const MAPBOX_TOKEN = 'pk.eyJ1IjoiMHg3YjEiLCJhIjoiY2lwbHMxNnRvMDJkZXU5bmozYjF1a3UyYSJ9.ec73WL0KE8xDc9JFrchXPg';
const BASE = new Date().getTime();
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
      showTrails: true,
      showEmissionsHist: false,
      showEmissionsLive: false,

      vehicleCount: 0,
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
    return (time.getTime() - BASE);
    // return (time.getTime() - BASE) / 1000;
    // return time.getTime();
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
        vehicleCount: liveVehiclePaths.size,
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

  getLiveLayers() {
    const {
      liveVehiclePaths,
      lastTime,
      showTrails,
      showEmissionsLive,
    } = this.state;

    console.log('liveVehiclePaths', liveVehiclePaths.toJS());

    return [
      showTrails && new TripsLayer({
        id: 'trips-layer',
        data: liveVehiclePaths,
        getPath: ([, d]) => d.get('path').toJS(),
        getTimestamps: ([, d]) => d.get('timestamps').toJS(),
        getColor: [0, 0, 0],
        // getColor: [253, 128, 93],
        opacity: 0.9,
        rounded: true,
        trailLength: 60000, // 60 seconds 
        widthMinPixels: 5,
        currentTime: lastTime,
        // shadowEnabled: false,
      }),

      0 && showEmissionsLive && new HeatmapLayer({
        id: 'heatmap-layer',
        data: liveVehiclePaths, // FIX THIS
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

  getHistLayers() {
    const {
      showTrips,
      showEmissionsHist,
      histVehiclePaths,
      histVehicleDataFiltered,
    } = this.state;

    return [
      showTrips && new PathLayer({
        id: 'path-layer',
        data: histVehiclePaths,
        pickable: true,
        getPath: ([, d]) => d.get('path').toJS(),
        // getColor: ([, d]) => hsv2rgb(
        //   100 - mapRange(d.get('co2'), 0, 22427, 0, 100),
        //   100,
        //   100),
        // widthMaxPixels: 10,
        getWidth: ([, d]) => {
          // return d.get('path').size / 15;
          // return Math.floor(Math.random() * 6);
          return mapRange(d.get('path').size, 0, 500, 0, 10);
        },
      }),

      showEmissionsHist && new HexagonLayer({
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

      0 && showEmissionsHist && new HeatmapLayer({
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

  renderResolutionFilter(label, timeSeconds = 0) {
    return (
      <Tag
        closeable={false}
        variant={VARIANT.outlined}
        onClick={() => {
          const {
            filterValue: [min,],
            timeRange: [rangeMin, rangeMax],
          } = this.state;
          let newRange;

          if (!timeSeconds) {
            newRange = [rangeMin, rangeMax];
          } else {
            let max = min + timeSeconds * 1000;
            if (max > rangeMax) {
              max = rangeMax;
            }

            newRange = [min, max];
          }

          this.filterDataRange({
            value: newRange,
          });
        }}
      >
        {label}
      </Tag>
    );
  }

  renderHistoryOptions() {
    const {
      showTrips,
      showEmissionsHist,
      timeRange,
      filterValue,
      histVehData,
    } = this.state;

    return (
      <Fragment>
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
            checked={showEmissionsHist}
            onChange={({ target: { checked } }) => this.setState({ showEmissionsHist: checked })}
            labelPlacement={LABEL_PLACEMENT.right}
          >
            Show Emissions
          </Checkbox>
        </FormControl>
        {
          histVehData.length && (
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
                  {this.renderResolutionFilter('5s', 5)}
                  {this.renderResolutionFilter('30s', 30)}
                  {this.renderResolutionFilter('1m', 60)}
                  {this.renderResolutionFilter('10m', 60 * 10)}
                  {this.renderResolutionFilter('30m', 60 * 30)}
                  {this.renderResolutionFilter('1h', 60 * 60)}
                  {this.renderResolutionFilter('All')}
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
      </Fragment>
    );
  }

  renderLiveOptions() {
    const {
      showTrails,
      showEmissionsLive,
    } = this.state;

    return (
      <Fragment>
        <FormControl>
          <Checkbox
            checkmarkType={STYLE_TYPE.toggle}
            labelPlacement={LABEL_PLACEMENT.right}
            checked={showTrails}
            onChange={({ target: { checked } }) => this.setState({ showTrails: checked })}
          >
            Show Trails
          </Checkbox>
        </FormControl>
        <FormControl>
          <Checkbox
            checkmarkType={STYLE_TYPE.toggle}
            checked={showEmissionsLive}
            onChange={({ target: { checked } }) => this.setState({ showEmissionsLive: checked })}
            labelPlacement={LABEL_PLACEMENT.right}
          >
            Show Emissions
          </Checkbox>
        </FormControl>
      </Fragment>
    );
  }

  renderStats(values = []) {
    return (
      <ListItem sublist_>
        {
          values.map(({ value, description }, i) => (
            <ListItemLabel key={i} description={value}>
              {description}
            </ListItemLabel>
          ))
        }
      </ListItem>
    );
  }

  getRecorderTime(startDateMs, endDateMs) {
    return moment.utc(
      moment(endDateMs).diff(moment(startDateMs))
    ).format('HH:mm:ss');
  }

  renderStatsHist() {
    return this.renderStats([
      { description: 'Vehicles', value: '200' },
      { description: 'CO2 Level', value: '10ppm' },
      { description: 'Recorder time', value: '05:20:00' },
    ]);
  }

  renderStatsLive() {
    const {
      vehicleCount,
      lastTime
    } = this.state;

    return this.renderStats([
      { description: 'Vehicles', value: vehicleCount },
      { description: 'CO2 Level', value: '4439ppm' },
      { description: 'Recorded time', value: this.getRecorderTime(BASE, lastTime + BASE) },
    ]);
  }

  render() {
    const {
      isLiveMode,
    } = this.state;

    const renderedLayers = isLiveMode
      ? this.getLiveLayers()
      : this.getHistLayers();

    return (
      <StyletronProvider value={engine}>
        <BaseProvider theme={LightTheme}>
          <DeckGL
            layers={renderedLayers}
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
                <HeaderNavigation style_={{ borderBottom: 0 }}>
                  <NavigationList $align={ALIGN.left}>
                    <NavigationItem style={{ paddingLeft: 0 }}>
                      <Display4>CO2 Emissions</Display4>
                    </NavigationItem>
                  </NavigationList>
                  <NavigationList $align={ALIGN.center} />
                  <NavigationList $align={ALIGN.right}>
                    <NavigationItem>
                      <Checkbox
                        checkmarkType={STYLE_TYPE.toggle}
                        isError
                        checked={isLiveMode}
                        onChange={({ target: { checked } }) => this.setState({ isLiveMode: checked })}
                        labelPlacement={LABEL_PLACEMENT.left}
                      >
                        Live
                      </Checkbox>
                    </NavigationItem>
                  </NavigationList>
                </HeaderNavigation>
                {
                  isLiveMode
                    ? this.renderStatsLive()
                    : this.renderStatsHist()
                }
                {/* <Paragraph3>
                  This app shows the CO2 emissions of urban traffic.
                  Two modes available: real-time and historical
                </Paragraph3> */}
              </StyledBody>
              <StyledAction>
                {
                  isLiveMode
                    ? this.renderLiveOptions()
                    : this.renderHistoryOptions()
                }
              </StyledAction>
            </Card>
          </ContainerInfo>
          <CardLegend />
        </BaseProvider>
      </StyletronProvider>
    );
  }
}