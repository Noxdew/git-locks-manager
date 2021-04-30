import React, { useEffect, useState, useRef } from "react";
import Box from "@primer/components/lib/Box";
import BorderBox from "@primer/components/lib/BorderBox";
import TextInput from "@primer/components/lib/TextInput";
import Tooltip from "@primer/components/lib/Tooltip";
import { ButtonOutline, ButtonDanger } from "@primer/components/lib/Button";
import styled from 'styled-components';
import { LockIcon, UnlockIcon, AlertIcon, FileIcon, FilterIcon } from '@primer/octicons-react';
import { get as themeGet } from '@primer/components/lib/constants';
import { withTranslation } from "react-i18next";
import { useParams, useHistory } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import { startFetching, stopFetching, setFiles } from 'Redux/components/files/filesSlice';
import { addError } from 'Redux/components/errors/errorsSlice';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import sortBy from 'lodash/sortBy';
import { QuickScore } from 'quick-score';
import latinize from 'latinize';
import moment from 'moment';

const Background = styled(Box)`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const FilterBox = styled(Box)`
  padding: ${themeGet('space.2')};

  & > * {
    width: 100%;
  }
`;

const FilesBox = styled(BorderBox)`
  margin: ${themeGet('space.2')};
  margin-top: 0;

  & > *:not(:last-child) {
    border-bottom: 1px solid ${themeGet('colors.border.primary')};
  }
`;

const FileBox = styled(Box)`
  display: flex;
  padding: ${themeGet('space.2')};
  justify-content: space-between;

  &:hover {
    background-color: ${themeGet('colors.bg.secondary')};
  }
`;

const FileBoxSection = styled(Box)`
  display: flex;

  & > *:first-child {
    margin-right: ${themeGet('space.2')};
  }

  & > * {
    align-self: center;
  }

  &:last-child > span > svg {
    margin-left: ${themeGet('space.2')};
  }

  & mark {
    background-color: unset;
    color: ${themeGet('colors.text.link')};
    font-weight: ${themeGet('fontWeights.bold')};
  }
`;

const FileRow = withTranslation()(function FileRow(props) {
  const [working, setWorking] = useState(false);

  useEffect(() => {
    setWorking(false);
  }, [props.lockOwner, props.lastUpdated]);

  const { t } = props;
  return (
    <FileBox>
      <FileBoxSection>
        {props.isMissing ? (
          <Tooltip wrap noDelay direction="e" aria-label={t("This file is not in your branch. Once unlocked this row will disappear.")}>
            <AlertIcon size={16} />
          </Tooltip>
        ) : (
          <FileIcon size={16} />
        )}
        <span>{props.path}</span>
      </FileBoxSection>
      <FileBoxSection>
        {props.lockOwner ? (
          <>
            <Tooltip wrap noDelay direction="w" aria-label={`${t("Locked")} ${moment(props.lockTime).fromNow()}`}>
              {props.lockOwner}
              <LockIcon size={16} />
            </Tooltip>
            <ButtonDanger disabled={working} onClick={() => {
              setWorking(true);
              props.onUnlock(props.path);
            }}>{t('Unlock')}</ButtonDanger>
          </>
        ) : (
          <>
            <UnlockIcon size={16} />
            <ButtonOutline disabled={working} onClick={() => {
              setWorking(true);
              props.onLock(props.path);
            }}>{t('Lock')}</ButtonOutline>
          </>
        )}
      </FileBoxSection>
    </FileBox>
  )
});

const highlight = (file, path) => {
  if (isEmpty(file.matches[path])) {
    return get(file.item, path);
  }

  const substrings = [];
  let previousEnd = 0;
  const string = get(file.item, path);

  for (let [start, end] of file.matches[path]) {
    const prefix = string.substring(previousEnd, start);
    const match = <mark>{string.substring(start, end)}</mark>;

    substrings.push(prefix, match);
    previousEnd = end;
  }

  substrings.push(string.substring(previousEnd));

  return <span>{React.Children.toArray(substrings)}</span>;
}

const quickScoreOptions = {
  transformString: s => latinize(s).toLowerCase(),
  keys: ["path", "lock.owner.name"],
};

function Files(props) {
  const { repoid } = useParams();
  const [filter, setFilter] = useState('');
  const repos = useSelector((state) => state.repos.list);
  const files = useSelector((state) => state.files.list);
  const filesLastUpdated = useSelector((state) => state.files.lastUpdated);
  const isRepoSelectorOpen = useSelector((state) => state.repos.selectorOpen);
  const history = useHistory();
  const dispatch = useDispatch();
  const searchLib = useRef(new QuickScore([], quickScoreOptions));
  const filterField = useRef();
  const isRepoSelectorOpenRef = useRef();

  let repo;
  if (repoid) {
    repo = repos.find(r => r.id === repoid);
  } else {
    repo = undefined;
  }

  useEffect(() => {
    isRepoSelectorOpenRef.current = isRepoSelectorOpen;
  }, [isRepoSelectorOpen]);

  useEffect(() => {
    refreshFiles();
    document.addEventListener(`update-${repoid}`, handleFiles);
    document.addEventListener(`error-${repoid}`, handleError);
    return () => {
      document.removeEventListener(`update-${repoid}`, handleFiles);
      document.removeEventListener(`error-${repoid}`, handleError);
    }
  }, [repoid]);

  useEffect(() => {
    document.addEventListener('refreshFiles', refreshFiles);
    document.addEventListener('keydown', focusFilter);
    return () => {
      document.removeEventListener('refreshFiles', refreshFiles);
      document.removeEventListener('keydown', focusFilter);
    };
  }, []);

  if (!repo) {
    history.push('/');
    return null;
  }

  const refreshFiles = () => {
    dispatch(startFetching());
    window.api.git.listLockableFiles(repo.path)
      .then(files => {
        document.dispatchEvent(new CustomEvent(`update-${repoid}`, { detail: files }));
      })
      .catch(err => {
        document.dispatchEvent(new CustomEvent(`error-${repoid}`, { detail: err }));
      });
  };

  const focusFilter = () => {
    if (filterField.current && !isRepoSelectorOpenRef.current) {
      filterField.current.focus();
    }
  };

  const handleFiles = (e) => {
    const { detail: files } = e;
    searchLib.current.setItems(files);
    dispatch(setFiles(files));
  };

  const handleError = ({ detail: err }) => {
    dispatch(addError(err.message || err));
    dispatch(stopFetching());
  }

  const onLock = (filePath) => {
    window.api.git.lockFile(repo.path, filePath)
      .catch(err => dispatch(addError(err.message || err)))
      .finally(() => refreshFiles());
  };

  const onUnlock = (filePath) => {
    window.api.git.unlockFile(repo.path, filePath)
      .catch(err => dispatch(addError(err.message || err)))
      .finally(() => refreshFiles());
  };

  let renderedFiles;
  if (filter) {
    const filtered = searchLib.current.search(filter);
    renderedFiles = filtered.map(file => (
      <FileRow
        key={file.item.path}
        path={highlight(file, 'path')}
        lockOwner={highlight(file, 'lock.owner.name')}
        lockTime={get(file.item, 'lock.locked_at')}
        isMissing={file.item.isMissing}
        repo={repo}
        onLock={onLock}
        onUnlock={onUnlock}
        lastUpdated={filesLastUpdated}
      />
    ));
  } else {
    renderedFiles = sortBy(files, 'path').map(file => (
      <FileRow
        key={file.path}
        path={file.path}
        lockOwner={get(file, 'lock.owner.name')}
        lockTime={get(file, 'lock.locked_at')}
        isMissing={file.isMissing}
        repo={repo}
        onLock={onLock}
        onUnlock={onUnlock}
        lastUpdated={filesLastUpdated}
      />
    ));
  }

  const { t } = props;
  return (
    <Background bg="bg.primary">
      <FilterBox>
        <TextInput
          ref={filterField}
          aria-label={t("Filter")}
          name="filter"
          placeholder={t("Filter")}
          icon={FilterIcon}
          onChange={({ target: { value } }) => setFilter(value)}
        />
      </FilterBox>
      {isEmpty(renderedFiles) ? null : (
        <FilesBox>
          {renderedFiles}
        </FilesBox>
      )}
    </Background>
  );
}

export default withTranslation()(Files);
