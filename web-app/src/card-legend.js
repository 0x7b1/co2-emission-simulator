import React, { PureComponent } from 'react';
import { Card, StyledBody } from "baseui/card";
import { styled } from 'baseui';
import { Paragraph3 } from 'baseui/typography';

const ContainerInfo = styled('div', {
  position: 'absolute',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  bottom: '20px',
  right: '20px',
  zIndex: 1,
  width: '240px',
});

export default class CardLegend extends PureComponent {
  renderCO2LinearGauge() {
    const { co2ColorRange } = this.props;

    return (
      <svg style={{ width: '100%', height: '30px' }}>
        <g transform="translate(13, 0)">
          <linearGradient id="lineargradient" x1="0" y1="0" x2="100%" y2="0">
            {
              co2ColorRange.map(([r, g, b], i) => (
                <stop key={i} offset={i / 10} stopColor={`rgb(${r}, ${g}, ${b})`} />
              ))
            }
          </linearGradient>
          <rect width='166' height='10' style={{ fill: 'url("#lineargradient")' }}></rect>
          <g transform="translate(0, 10)" style={{ fill: 'none', fontFamily: 'sans-serif', textAnchor: 'middle', fontSize: 10 }} >
            <g transform="translate(0.5,0)">
              <line stroke="currentColor" y2="5"></line>
              <text fill="currentColor" y="8" dy="0.71em">0</text>
            </g>
            <g transform="translate(83.5,0)">
              <line stroke="currentColor" y2="5"></line>
              <text fill="currentColor" y="8" dy="0.71em">2100</text>
            </g>
            <g transform="translate(165.5,0)">
              <line stroke="currentColor" y2="5"></line>
              <text fill="currentColor" y="8" dy="0.71em">5000</text>
            </g>

          </g>
        </g>
      </svg>
    );
  }

  render() {
    return (
      <ContainerInfo>
        <Card>
          <StyledBody>
            <Paragraph3 style={{ textAlign: 'center' }}>
              CO2 intensity (mg)
            </Paragraph3>
            {this.renderCO2LinearGauge()}
          </StyledBody>
        </Card>
      </ContainerInfo>
    );
  }
}
