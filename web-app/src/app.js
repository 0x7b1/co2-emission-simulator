import React, { Component, Fragment } from 'react';
import { StaticMap } from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import { PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { FormControl } from 'baseui/form-control';
import { Card, StyledBody, StyledAction } from "baseui/card";
import { styled } from 'baseui';
import { Display4 } from 'baseui/typography';
import { Checkbox, LABEL_PLACEMENT, STYLE_TYPE } from "baseui/checkbox";
import { Tag, VARIANT } from "baseui/tag";
import { json } from 'd3-fetch';
import { Map, fromJS, List } from 'immutable';
import { Client as Styletron } from 'styletron-engine-atomic';
import { Provider as StyletronProvider } from 'styletron-react';
import { LightTheme, BaseProvider } from 'baseui';
import moment from 'moment';
import { ListItem, ListItemLabel } from "baseui/list";
import {
  HeaderNavigation,
  ALIGN,
  StyledNavigationItem as NavigationItem,
  StyledNavigationList as NavigationList,
} from 'baseui/header-navigation';
import { Spinner } from 'baseui/spinner';

import VehicleFilter from './vehicle-filter';
import CardLegend from './card-legend';

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
  bearing: 0,

  maxZoom: 17,
};

const MAP_STYLE = 'mapbox://styles/mapbox/dark-v9';
const MAPBOX_TOKEN = 'pk.eyJ1IjoiMHg3YjEiLCJhIjoiY2lwbHMxNnRvMDJkZXU5bmozYjF1a3UyYSJ9.ec73WL0KE8xDc9JFrchXPg';
const BASE_DATE = new Date().getTime();
const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = MS_PER_SECOND * 60;
const URL_DATA = 'http://localhost:8080/api/vehicles';
const URL_WS = 'ws://localhost:8081/ws';

const mapRange = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;
const co2ColorRange = [
  [42, 163, 100],
  [162, 206, 86],
  [240, 225, 75],
  [222, 191, 68],
  [205, 158, 61],
  [188, 124, 53],
  [171, 91, 46],
  [143, 61, 35],
  [82, 39, 12],
  [56, 29, 2],
];

export default class App extends Component {
  constructor(props) {
    super(props);

    const timeRange = [Infinity, -Infinity];

    this.state = {
      ws: null,
      liveVehiclePaths: Map(),
      liveVehicleData: List(),
      histVehiclePaths: Map(),
      histVehicleData: List(),
      histVehicleDataFiltered: List(),
      lastTime: 0,
      timeRange,
      filterValue: timeRange,
      hoveredObject: null,
      isLiveMode: true,
      showTrips: true,
      showTrails: false,
      showVehicles: true,
      showEmissionsHist: false,
      showEmissionsLive: false,
    };
  }

  componentDidMount() {
    this.fetchData();
    this.connectWS();
  }

  updateVehicleStep = (vehiclePaths, stepTime, data) =>
    vehiclePaths.update(
      data.get('veh_id'),
      fromJS({ path: [], timestamps: [] }),
      v => v
        .update('path', path => path.push(List([data.get('lng'), data.get('lat')])))
        .update('timestamps', timestamps => timestamps.push(stepTime))
        .update('co2', () => data.get('co2'))
    )

  connectWS = () => {
    const ws = new WebSocket(URL_WS);

    ws.onopen = () => this.setState({ ws });
    ws.onmessage = ({ data }) => {
      const { liveVehiclePaths, liveVehicleData } = this.state;
      const stepTime = new Date().getTime() - BASE_DATE;
      const stepData = fromJS(JSON.parse(data));

      this.setState({
        liveVehiclePaths: this.updateVehicleStep(liveVehiclePaths, stepTime, stepData),
        liveVehicleData: liveVehicleData.push(stepData),
        lastTime: stepTime,
      });
    };
    ws.onerror = err => ws.close();
    ws.onclose = e => console.log('DISCONNECTED');
  }

  processHistoryData(histVehicleData, min = -Infinity, max = +Infinity) {
    let histVehiclePaths = Map();
    let histVehicleDataFiltered = List();

    histVehicleData.forEach(data => {
      const stepTime = new Date(data.get('time')).getTime();

      if (stepTime >= min && stepTime <= max) {
        histVehiclePaths = this.updateVehicleStep(histVehiclePaths, stepTime, data);
        histVehicleDataFiltered = histVehicleDataFiltered.push(data);
      }
    });

    return {
      filterValue: [min, max],
      histVehiclePaths,
      histVehicleDataFiltered,
    };
  }

  fetchData = async () => {
    try {
      const histVehicleData = fromJS(await json(URL_DATA));
      const timeRange = [
        new Date(histVehicleData.first().get('time')).getTime(),
        new Date(histVehicleData.last().get('time')).getTime(),
      ];

      this.setState({
        histVehicleData,
        timeRange,
        ...this.processHistoryData(histVehicleData, ...timeRange),
      });
    } catch (error) {
      console.error(error);
    }
  }

  _onHover = ({ x, y, object }) => {
    this.setState({ x, y, hoveredObject: object });
  }

  getLiveLayers() {
    const {
      liveVehiclePaths,
      liveVehicleData,
      lastTime,
      showTrails,
      showEmissionsLive,
      showVehicles,
    } = this.state;

    return [
      showTrails && new TripsLayer({
        id: 'trips-layer',
        data: liveVehiclePaths,
        getPath: ([, d]) => d.get('path').toJS(),
        getTimestamps: ([, d]) => d.get('timestamps').toArray(),
        getColor: [255, 140, 0],
        opacity: 0.9,
        rounded: true,
        trailLength: MS_PER_SECOND * 30,
        widthMinPixels: 5,
        currentTime: lastTime,
      }),

      showVehicles && new ScatterplotLayer({
        id: 'vehicles-layer',
        data: liveVehiclePaths,
        getPosition: ([_, d]) => d.get('path').last().toArray(),
        getFillColor: d => [255, 140, 0],
        getRadius: d => 2,
        pickable: true,
        opacity: 0.8,
        filled: true,
        radiusMinPixels: 6,
        radiusMaxPixels: 10,
      }),

      showEmissionsLive && new HeatmapLayer({
        id: 'live-heatmap-layer',
        data: liveVehicleData,
        getPosition: d => [d.get('lng'), d.get('lat')],
        getWeight: d => d.get('co2'),
        colorRange: co2ColorRange,
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
        getWidth: ([, d]) => mapRange(d.get('path').size, 0, 500, 2, 7),
        getColor: () => [255, 140, 0],
        opacity: 0.5,
      }),

      showEmissionsHist && new HeatmapLayer({
        id: 'historical-heatmap-layer',
        data: histVehicleDataFiltered,
        getPosition: d => [d.get('lng'), d.get('lat')],
        getWeight: d => d.get('co2'),
        colorRange: co2ColorRange,
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
    return moment(t).format(format);
  }

  filterDataRange = ({ value: [min, max] }) => {
    const { histVehicleData } = this.state;
    const updatedHistoryData = this.processHistoryData(histVehicleData, min, max);

    this.setState({
      ...updatedHistoryData,
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
      histVehicleData,
    } = this.state;

    if (histVehicleData.isEmpty()) {
      return (
        <Spinner />
      );
    }

    return (
      <Fragment>
        <FormControl>
          <Checkbox
            checkmarkType={STYLE_TYPE.toggle}
            checked={showTrips}
            onChange={({ target: { checked } }) => this.setState({ showTrips: checked })}
            labelPlacement={LABEL_PLACEMENT.right}
          >
            Show Traveled Paths
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
        <FormControl label='Date filter'>
          <VehicleFilter
            value={filterValue}
            min={timeRange[0]}
            max={timeRange[1]}
            step={MS_PER_MINUTE}
            formatTimeLabelThumb={t => this.formatTimeLabel(t, '(DD/MM) HH:mm:ss')}
            formatTimeLabelTick={t => this.formatTimeLabel(t, 'DD/MM')}
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
      </Fragment>
    );
  }

  renderLiveOptions() {
    const {
      showTrails,
      showVehicles,
      showEmissionsLive,
    } = this.state;

    return (
      <Fragment>
        <FormControl>
          <Checkbox
            checkmarkType={STYLE_TYPE.toggle}
            labelPlacement={LABEL_PLACEMENT.right}
            checked={showVehicles}
            onChange={({ target: { checked } }) => this.setState({ showVehicles: checked })}
          >
            Show Vehicles
          </Checkbox>
        </FormControl>
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
    const {
      timeRange,
      histVehiclePaths,
      histVehicleData,
    } = this.state;

    if (histVehicleData.isEmpty()) {
      return null;
    }

    return this.renderStats([
      { description: 'Vehicles', value: histVehiclePaths.size },
      { description: 'CO2 Level', value: '10ppm' },
      { description: 'Recorded ime', value: this.getRecorderTime(...timeRange) },
    ]);
  }

  renderStatsLive() {
    const {
      liveVehiclePaths,
      lastTime
    } = this.state;

    return this.renderStats([
      { description: 'Vehicles', value: liveVehiclePaths.size },
      { description: 'CO2 Level', value: '0ppm' },
      { description: 'Recorded time', value: this.getRecorderTime(BASE_DATE, lastTime + BASE_DATE) },
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
          <CardLegend
            co2ColorRange={co2ColorRange}
          />
        </BaseProvider>
      </StyletronProvider>
    );
  }
}