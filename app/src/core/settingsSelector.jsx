import React from "react";
import { withTranslation } from "react-i18next";
import { Button, Box, themeGet } from '@primer/react';
import styled from 'styled-components';
import { useSelector, useDispatch } from 'react-redux';
import { toggle } from 'Redux/components/settings/settingsSlice';
import { UploadIcon, FileBinaryIcon } from '@primer/octicons-react'
import { NavLink, useLocation } from "react-router-dom";
import ROUTES from "Constants/routes";
import MenuBar from 'Core/menuBar';

const OverflowContainer = styled(Box)`
  position: absolute;
  padding-top: ${50 + MenuBar.height}px;
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 99;

  & > *:first-child {
    max-width: 250px;
  }
`;

const BlackFill = styled(Box)`
  flex: 1;
  background: ${themeGet('colors.selectMenu.tapHighlight')};
  pointer-events: auto;
`;

const SettingsContainer = styled(Box)`
  width: 250px;
  background: ${themeGet('colors.canvas.subtle')};
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
  background-color: ${themeGet('colors.btn.bg')};
  color: ${themeGet('colors.btn.text')};
  text-decoration: none;
  border-bottom: 1px solid ${themeGet('colors.border.default')};

  &:hover, &:focus {
    background-color: ${themeGet('colors.btn.hoverBg')};
  }

  & > .octicon {
    align-self: center;
    margin-right: ${themeGet('space.2')};
  }
`;

const TwoRowText = styled.div`
  flex-grow: 1;
  text-align: initial;

  & > div.description {
    color: ${themeGet('colors.btn.text')};
    color: #8b949e;
    font-size: 11px;
    text-overflow: ellipsis;
    line-height: initial;
  }

  & > div.title {
    color: ${themeGet('colors.btn.text')};
    font-size: 12px;
    text-overflow: ellipsis;
    line-height: initial;
    margin: 0;
  }
`;

function SettingsSelector(props) {
  // This component is outside of a route so it doesn't have access to useParams
  const location = useLocation();
  const repoid = location.pathname.split('/')[1];
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
