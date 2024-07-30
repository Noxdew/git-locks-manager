import React, { useState, useEffect } from "react";
import styled from 'styled-components';
import { Button, Box, themeGet } from '@primer/react';
import { RepoIcon, GearIcon, SyncIcon, TriangleDownIcon, TriangleUpIcon } from '@primer/octicons-react'
import { withTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import { toggle as reposToggle } from 'Redux/components/repos/reposSlice';
import { toggle as settingsToggle } from 'Redux/components/settings/settingsSlice';
import moment from 'moment';

const Toolbar = styled(Box)`
  display: flex;
  height: 50px;
  width: 100%;
  background-color: ${themeGet('colors.header.bg')};

  & > *:first-child {
    width: 250px;
  }

  & > *:not(:first-child) {
    border-left: 1px solid transparent !important;
  }

  & > div {
    flex: 1;
  }

  & > button, & > div {
    border: 1px solid black;

    &:active, &:focus, &:hover, &:disabled {
      border: 1px solid black;
    }
  }

  & > button:hover {
    border: 1px solid ${themeGet('colors.header.divider')} !important;
  }
`;

const StyledButton = styled(Button)`
  display: flex;
  flex: 1;
  flex-direction: row;
  height: 100%;
  max-width: 250px;
  border-radius: 0;
  padding: 10px;
  background-color: ${themeGet('colors.header.bg')};
  box-shadow: none;

  &:disabled {
    background-color: ${themeGet('colors.header.bg')};
  }

  &:hover:not(:disabled) {
    background-color: ${themeGet('colors.headerSearch.border')} !important;
  }

  &:not(:disabled) > svg {
    fill: ${themeGet('colors.header.text')};
  }

  & > *:first-child {
    margin-right: 10px;
    justify-content: left;
  }

  & .octicon {
    align-self: center;
    fill: ${themeGet('colors.header.text')};
  }

  &.open {
    background-color: ${themeGet('colors.bg.primary')};
    border-bottom: 1px solid ${themeGet('colors.bg.primary')};

    &:not(:disabled) > svg {
      fill: ${themeGet('colors.btn.text')};
    }

    &:hover {
      background-color: ${themeGet('colors.headerSearch.border')};
    }
  }
`;

const SpinningIcon = styled(SyncIcon)`
  animation: spin-animation 5s infinite;
  animation-timing-function: linear;
  align-self: center;

  @keyframes spin-animation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const TwoRowText = styled.div`
  flex-grow: 1;
  text-align: initial;

  & > div.description {
    color: #8b949e;
    font-size: 11px;
    text-overflow: ellipsis;
    line-height: initial;
  }

  & > div.title {
    color: ${themeGet('colors.header.text')};
    font-size: 12px;
    text-overflow: ellipsis;
    line-height: initial;
    margin: 0;
  }
`;

function Nav(props) {
  // This component is outside of a route so it doesn't have access to useParams
  const location = useLocation();
  const repoid = location.pathname.split('/')[1];
  const isOpenRepoSelector = useSelector((state) => state.repos.selectorOpen);
  const isOpenSettingsSelector = useSelector((state) => state.settings.selectorOpen);
  const repos = useSelector((state) => state.repos.list);
  const filesLastRefreshed = useSelector((state) => state.files.lastUpdated);
  const filesFetching = useSelector((state) => state.files.fetching);
  const dispatch = useDispatch();
  const [dateString, setDateString] = useState('');

  let repo;
  if (repoid) {
    repo = repos.find(r => r.id === repoid);
  } else {
    repo = undefined;
  }

  const updateDateString = (date) => {
    if (date) {
      setDateString(moment(date).fromNow());
    }
  }

  useEffect(() => {
    const date = filesLastRefreshed;
    updateDateString(date);
    const interval = setInterval(() => updateDateString(date), 1000);
    return () => clearInterval(interval);
  }, [filesLastRefreshed]);

  const { t } = props;

  return (
    <Toolbar>
      <StyledButton
        onClick={() => {
          if (isOpenSettingsSelector) {
            dispatch(settingsToggle());
          }
          dispatch(reposToggle());
        }}
        className={isOpenRepoSelector ? 'open' : ''}
        leadingVisual={RepoIcon}
        trailingAction={isOpenRepoSelector ? TriangleUpIcon : TriangleDownIcon}
      >
        <TwoRowText>
          <Box className="description">
            {t("Current Repository")}
          </Box>
          <Box className="title">
            {repo ? repo.name : t("Add or Select a Repository")}
          </Box>
        </TwoRowText>
      </StyledButton>

      <StyledButton
        disabled={!repo}
        onClick={() => {
          if (isOpenRepoSelector) {
            dispatch(reposToggle());
          }
          dispatch(settingsToggle());
        }}
        className={isOpenSettingsSelector ? 'open' : ''}
        leadingVisual={GearIcon}
        trailingAction={TriangleDownIcon}
      >
        <TwoRowText>
          <Box className="description">
            {t("Configure Repository")}
          </Box>
          <Box className="title">
            {t("Attributes and LFS Config")}
          </Box>
        </TwoRowText>
      </StyledButton>

      <StyledButton
        disabled={!repo || filesFetching}
        onClick={() => document.dispatchEvent(new Event('refreshFiles'))}
        leadingVisual={filesFetching ? SpinningIcon : SyncIcon}
      >
        <TwoRowText>
          <Box className="title">
            {t("Refresh")}
          </Box>
          <Box className="description">
            {filesFetching ? (
              <>
                {t('Hold on...')}
              </>
            ) : (
              <>
                {t("Last refreshed")} {filesLastRefreshed ? dateString : t('never')}
              </>
            )}
          </Box>
        </TwoRowText>
      </StyledButton>
      <div></div>
    </Toolbar>
  );
}

export default withTranslation()(Nav);
