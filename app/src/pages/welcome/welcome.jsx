import React from "react";
import Box from "@primer/components/lib/Box";
import styled from 'styled-components';
import { ArrowUpIcon } from '@primer/octicons-react';
import { get as themeGet } from '@primer/components/lib/constants';
import { withTranslation } from "react-i18next";

const Background = styled(Box)`
  flex: 1;
`;

const ArrowBox = styled(Box)`
  max-width: 250px;
  display: flex;
  justify-content: center;
  padding: ${themeGet('space.3')};
  padding-bottom: ${themeGet('space.2')};
`;

const TextBox = styled(Box)`
  width: 100%;
  padding: ${themeGet('space.2')};
  display: flex;
  justify-content: left;
  font-size: ${themeGet('fontSizes.3')};
`;

function Welcome(props) {
  const { t } = props;
  return (
    <Background bg="bg.primary">
      <ArrowBox>
        <ArrowUpIcon size={24} />
      </ArrowBox>
      <TextBox>
        {t("Add or Select a Repository")}
      </TextBox>
    </Background>
  );
}

export default withTranslation()(Welcome);
