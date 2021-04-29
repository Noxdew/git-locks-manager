import React from "react";
import { withTranslation } from "react-i18next";
import Button from '@primer/components/lib/Button';
import Box from '@primer/components/lib/Box';
import styled from 'styled-components';
import { get as themeGet } from '@primer/components/lib/constants';
import { useSelector, useDispatch } from 'react-redux';
import { toggle } from 'Redux/components/settings/settingsSlice';
import { UploadIcon, FileBinaryIcon } from '@primer/octicons-react'
import { NavLink, useRouteMatch } from "react-router-dom";
import get from 'lodash/get';
import ROUTES from "Constants/routes";


const OverflowContainer = styled(Box)`
  position: absolute;
  padding-top: 50px;
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;

  & > *:first-child {
    max-width: 250px;
  }
`;

const BlackFill = styled(Box)`
  flex: 1;
  background: ${themeGet('colors.bg.backdrop')};
  pointer-events: auto;
`;

const SettingsContainer = styled(Box)`
  width: 250px;
  background: ${themeGet('colors.bg.primary')};
  pointer-events: auto;

  & > *:not(:first-child) {
    border-top-width: 0;
  }
`;

const StyledButton = styled(Button)`
  display: flex;
  flex-direction: row;
  width: 100%;
  border-radius: 0;
  padding: 10px;
  box-shadow: none;
  background-color: ${themeGet('colors.bg.primary')};

  & > .octicon {
    align-self: center;
    margin-right: ${themeGet('space.2')};
  }
`;

const TwoRowText = styled.div`
  flex-grow: 1;
  text-align: initial;

  & > div.description {
    color: ${themeGet('colors.text.tertiary')};
    color: #8b949e;
    font-size: 11px;
    text-overflow: ellipsis;
    line-height: initial;
  }

  & > div.title {
    color: ${themeGet('colors.text.primary')};
    font-size: 12px;
    text-overflow: ellipsis;
    line-height: initial;
    margin: 0;
  }
`;

function SettingsSelector(props) {
  const match = useRouteMatch(ROUTES.REPO);
  const repoid = get(match, 'params.repoid');
  const isOpen = useSelector((state) => state.settings.selectorOpen);
  const dispatch = useDispatch();

  if (!isOpen) {
    return null;
  }

  const { t } = props;

  return (
    <OverflowContainer>
      <BlackFill onClick={() => dispatch(toggle())} />
      <SettingsContainer>
        <StyledButton as={NavLink} to={ROUTES.REPO_ATTRIBUTES.replace(':repoid', repoid)}>
          <FileBinaryIcon size={16} />
          <TwoRowText>
            <Box className="title">
              {t("Configure Git Attributes")}
            </Box>
            <Box className="description">
              {t("How files are treated")}
            </Box>
          </TwoRowText>
        </StyledButton>
        <StyledButton as={NavLink} to={ROUTES.REPO_LFS_CONFIG.replace(':repoid', repoid)}>
          <UploadIcon size={16} />
          <TwoRowText>
            <Box className="title">
              {t("Configure Git LFS")}
            </Box>
            <Box className="description">
              {t("Which LFS server to use")}
            </Box>
          </TwoRowText>
        </StyledButton>
      </SettingsContainer>
      <BlackFill onClick={() => dispatch(toggle())} />
    </OverflowContainer>
  );
}

export default withTranslation()(SettingsSelector);
