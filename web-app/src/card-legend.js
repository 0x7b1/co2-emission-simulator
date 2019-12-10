import React, { PureComponent } from 'react';
import {
  Card,
  StyledBody,
} from "baseui/card";
import { styled } from 'baseui';
import { Display4, Paragraph3, Label3 } from 'baseui/typography';

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

function CO2LinearGauge() {
  return (
    <svg style={{ width: '100%', height: '30px' }}>
      <g transform="translate(13, 0)">
        <linearGradient id="lineargradient" x1="0" y1="0" x2="100%" y2="0">
          <stop offset="0" stopColor="rgb(42, 163, 100)"></stop>
          <stop offset="0.1111111111111111" stopColor="rgb(162, 206, 86)"></stop>
          <stop offset="0.2222222222222222" stopColor="rgb(240, 225, 75)"></stop>
          <stop offset="0.3333333333333333" stopColor="rgb(222, 191, 68)"></stop>
          <stop offset="0.4444444444444444" stopColor="rgb(205, 158, 61)"></stop>
          <stop offset="0.5555555555555556" stopColor="rgb(188, 124, 53)"></stop>
          <stop offset="0.6666666666666666" stopColor="rgb(171, 91, 46)"></stop>
          <stop offset="0.7777777777777778" stopColor="rgb(143, 61, 35)"></stop>
          <stop offset="0.8888888888888888" stopColor="rgb(82, 39, 12)"></stop>
          <stop offset="1" stopColor="rgb(56, 29, 2)"></stop>
        </linearGradient>
        <rect width="166" height="10" style={{ fill: 'url("#lineargradient")' }}></rect>
        <g transform="translate(0, 10)" fill="none" fontSize="10" fontFamily="sans-serif" textAnchor="middle">
          <g transform="translate(0.5,0)">
            <line stroke="currentColor" y2="5"></line>
            <text fill="currentColor" y="8" dy="0.71em">0</text>
          </g>
          <g transform="translate(83.5,0)">
            <line stroke="currentColor" y2="5"></line>
            <text fill="currentColor" y="8" dy="0.71em">2100</text>
          </g>
          <g transform="translate(166.5,0)">
            <line stroke="currentColor" y2="5"></line>
            <text fill="currentColor" y="8" dy="0.71em">5000</text>
          </g>
        </g>
      </g>
    </svg>
  );
}

export default class CardLegend extends PureComponent {
  render() {
    return (
      <ContainerInfo>
        <Card>
          <StyledBody>
            <Paragraph3 style={{ textAlign: 'center' }}>
              CO2 intensity (mg/s)
            </Paragraph3>
            <CO2LinearGauge />
            {/* <div
              style={{
                background: `
                  linear-gradient(
                    90deg,
                    rgba(255,0,0,1) 0%,
                    rgba(0,85,170,1) 67%,
                    rgba(0,200,255,1) 100%
                  )`,
                width: '100%',
                height: 10,
              }}
            /> */}
          </StyledBody>
        </Card>
      </ContainerInfo>
    );
  }
}
