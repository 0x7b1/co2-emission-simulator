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
  left: '20px',
  zIndex: 1,
  width: '300px',
});

export default class CardLegend extends PureComponent {
  render() {
    return (
      <ContainerInfo>
        <Card>
          <StyledBody>
            <Paragraph3>
              Here you can tweak the parameters to fit into the map
            </Paragraph3>
            <div
              style={{
                background:
                  'linear-gradient(90deg, rgba(255,0,0,1) 0%, rgba(0,85,170,1) 67%, rgba(0,200,255,1) 100%)',
                width: '100%',
                height: 10
              }}
            />
          </StyledBody>
        </Card>
      </ContainerInfo>
    );
  }
}
