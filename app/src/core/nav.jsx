import React, { useState, useEffect } from "react";
import styled from 'styled-components'
import Button from '@primer/components/lib/Button';
import Box from '@primer/components/lib/Box';
import { RepoIcon, GearIcon, SyncIcon, TriangleDownIcon, TriangleUpIcon } from '@primer/octicons-react'
import { get as themeGet } from '@primer/components/lib/constants';
import { withTranslation } from "react-i18next";
import { useRouteMatch } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import { toggle as reposToggle } from 'Redux/components/repos/reposSlice';
import { toggle as settingsToggle } from 'Redux/components/settings/settingsSlice';
import ROUTES from "Constants/routes";
import get from 'lodash/get';
import moment from 'moment';

const Toolbar = styled(Box)`
  display: flex;
  height: 50px;
  width: 100%;
  background-color: ${themeGet('colors.globalNav.bg')};

  & > *:first-child {
    width: 250px;
  }

  & > *:not(:first-child) {
    border-left: none;
  }

  & > div {
    flex: 1;
  }

  & > button, & > div {
    border: 1px solid black;

    &:not(:first-child) {
      border-left: none;
    }

    &:active, &:focus, &:hover, &:disabled {
      border: 1px solid black;

      &:not(:first-child) {
        border-left: none;
      }
    }
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
  background-color: ${themeGet('colors.globalNav.bg')};
  box-shadow: none;

  &:disabled {
    background-color: ${themeGet('colors.globalNav.bg')};
  }

  &:hover:not(:disabled) {
    background-color: #30363d;
  }

  &:not(:disabled) > svg {
    fill: ${themeGet('colors.globalNav.text')};
  }

  & > *:not(:last-child) {
    margin-right: 10px;
  }

  & > .octicon {
    align-self: center;
  }

  &.open {
    background-color: ${themeGet('colors.bg.primary')};
    border-bottom: 1px solid ${themeGet('colors.bg.primary')};

    &:not(:disabled) > svg {
      fill: ${themeGet('colors.text.primary')};
    }

    &:active, &:focus, &:hover, &:disabled {
      border-bottom: 1px solid ${themeGet('colors.bg.primary')};
    }

    & div.description {
      color: ${themeGet('colors.text.tertiary')};
    }

    & div.title {
      color: ${themeGet('colors.text.primary')};
    }

    &:hover {
      background-color: ${themeGet('colors.btn.hoverBg')};
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
    color: ${themeGet('colors.globalNav.text')};
    font-size: 12px;
    text-overflow: ellipsis;
    line-height: initial;
    margin: 0;
  }
`;

function Nav(props) {
  const match = useRouteMatch(ROUTES.REPO);
  const repoid = get(match, 'params.repoid');
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
      >
        <RepoIcon size={16} />
        <TwoRowText>
          <Box className="description">
            {t("Current Repository")}
          </Box>
          <Box className="title">
            {repo ? repo.name : t("Add or Select a Repository")}
          </Box>
        </TwoRowText>
        {isOpenRepoSelector ? (
          <TriangleUpIcon size={16} />
        ) : (
          <TriangleDownIcon size={16} />
        )}
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
      >
        <GearIcon size={16} />
        <TwoRowText>
          <Box className="description">
            {t("Configure Repository")}
          </Box>
          <Box className="title">
            {t("Attributes and LFS Config")}
          </Box>
        </TwoRowText>
        <TriangleDownIcon size={16} />
      </StyledButton>

      <StyledButton disabled={!repo || filesFetching} onClick={() => document.dispatchEvent(new Event('refreshFiles'))}>
        {filesFetching ? (
          <SpinningIcon size={16} />
        ) : (
          <SyncIcon size = {16} />
        )}
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
