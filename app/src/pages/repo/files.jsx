import React, { useEffect, useState, useRef } from "react";
import Box from "@primer/components/lib/Box";
import BorderBox from "@primer/components/lib/BorderBox";
import TextInput from "@primer/components/lib/TextInput";
import FilteredSearch from "@primer/components/lib/FilteredSearch";
import Dropdown from "@primer/components/lib/Dropdown";
import Tooltip from "@primer/components/lib/Tooltip";
import { ButtonOutline, ButtonDanger } from "@primer/components/lib/Button";
import styled from 'styled-components';
import { LockIcon, UnlockIcon, AlertIcon, FileIcon, FilterIcon, CheckIcon } from '@primer/octicons-react';
import { get as themeGet } from '@primer/components/lib/constants';
import { withTranslation } from "react-i18next";
import { useParams, useHistory } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import { startFetching, stopFetching, setFiles } from 'Redux/components/files/filesSlice';
import { addError } from 'Redux/components/errors/errorsSlice';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import sortBy from 'lodash/sortBy';
import lodashFilter from 'lodash/filter';
import { QuickScore } from 'quick-score';
import latinize from 'latinize';
import moment from 'moment';
import { Scrollbars } from "react-custom-scrollbars";
import { AutoSizer } from "react-virtualized";

const Background = styled(Box)`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const FilterBox = styled(Box)`
  padding: ${themeGet('space.2')};
  display: flex;

  & > *:first-child {
    margin-right: ${themeGet('space.2')};
    width: 100%;
  }
`;

const FilterTextInput = styled(TextInput)`
  width: 100%;
`;

const DropdownItemButton = styled(Dropdown.Item)`
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
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

const Flex = styled(Box)`
  flex: 1;
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
              props.onUnlock(props.rawPath);
            }}>{t('Unlock')}</ButtonDanger>
          </>
        ) : (
          <>
            <UnlockIcon size={16} />
            <ButtonOutline disabled={working} onClick={() => {
              setWorking(true);
              props.onLock(props.rawPath);
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

  const savedData = window.api.store.initial();

  const [sort, setSort] = useState(savedData['sort'] || 'locked');
  const [hardFilter, setHardFilter] = useState(savedData['hardFilter'] || 'all');
  const repos = useSelector((state) => state.repos.list);
  const files = useSelector((state) => state.files.list);
  const filesLastUpdated = useSelector((state) => state.files.lastUpdated);
  const isRepoSelectorOpen = useSelector((state) => state.repos.selectorOpen);
  const reposLoaded = useSelector((state) => state.repos.initialLoad);
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

  const refreshFiles = () => {
    if (!repo) {
      return;
    }

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
  };

  useEffect(() => {
    isRepoSelectorOpenRef.current = isRepoSelectorOpen;
  }, [isRepoSelectorOpen]);

  useEffect(() => {
    document.addEventListener(`update-${repoid}`, handleFiles);
    document.addEventListener(`error-${repoid}`, handleError);
    return () => {
      document.removeEventListener(`update-${repoid}`, handleFiles);
      document.removeEventListener(`error-${repoid}`, handleError);
    }
  }, [repoid]);

  useEffect(() => {
    refreshFiles();
  }, [repoid, repos]);

  useEffect(() => {
    document.addEventListener('refreshFiles', refreshFiles);
    document.addEventListener('keydown', focusFilter);
    return () => {
      document.removeEventListener('refreshFiles', refreshFiles);
      document.removeEventListener('keydown', focusFilter);
    };
  }, []);

  if (!repo) {
    if (reposLoaded) {
      history.push('/');
    }
    return null;
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

  const applyHardFilter = files => {
    if (hardFilter == 'locked') {
      return lodashFilter(files, f => get(f, 'lock.locked_at') || get(f, 'item.lock.locked_at'));
    } else if (hardFilter == 'unlocked') {
      return lodashFilter(files, f => !get(f, 'lock.locked_at') && !get(f, 'item.lock.locked_at'));
    }
    return files;
  }

  let renderedFiles;
  if (filter) {
    const filtered = searchLib.current.search(filter);
    renderedFiles = applyHardFilter(filtered).map(file => (
      <FileRow
        key={file.item.path}
        path={highlight(file, 'path')}
        rawPath={file.item.path}
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
    let sortedFiles = sortBy(applyHardFilter(files), 'path');
    if (sort == 'locked') {
      sortedFiles = sortBy(sortedFiles, f => !get(f, 'lock.locked_at'));
    }

    renderedFiles = sortedFiles.map(file => (
      <FileRow
        key={file.path}
        path={file.path}
        rawPath={file.path}
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

  let hardFilterText = t("All Files");
  if (hardFilter == 'locked') {
    hardFilterText = t("Locked Files");
  } else if (hardFilter == 'unlocked') {
    hardFilterText = t("Unlocked Files");
  }

  return (
    <Background bg="bg.primary">
      <FilterBox>
        <FilteredSearch>
          <Dropdown>
            <Dropdown.Button>{hardFilterText}</Dropdown.Button>
            <Dropdown.Menu direction="se">
              <DropdownItemButton onClick={() => {
                setHardFilter('all');
                window.api.store.write('hardFilter', 'all');
              }}>
                {t("All Files")} {hardFilter == 'all' ? <CheckIcon /> : null}
              </DropdownItemButton>
              <DropdownItemButton onClick={() => {
                setHardFilter('locked');
                window.api.store.write('hardFilter', 'locked');
              }}>
                {t("Locked Files")} {hardFilter == 'locked' ? <CheckIcon /> : null}
              </DropdownItemButton>
              <DropdownItemButton onClick={() => {
                setHardFilter('unlocked');
                window.api.store.write('hardFilter', 'unlocked');
              }}>
                {t("Unlocked Files")} {hardFilter == 'unlocked' ? <CheckIcon /> : null}
              </DropdownItemButton>
            </Dropdown.Menu>
          </Dropdown>
          <FilterTextInput
            ref={filterField}
            aria-label={t("Filter")}
            name="filter"
            placeholder={t("Filter")}
            icon={FilterIcon}
            onChange={({ target: { value } }) => setFilter(value)}
          />
        </FilteredSearch>
        <Dropdown>
          <Dropdown.Button>{t("Sorting")}</Dropdown.Button>
          <Dropdown.Menu direction="sw">
            <DropdownItemButton onClick={() => {
              setSort('path');
              window.api.store.write('sort', 'path');
            }}>
              {t("Path")} {sort == 'path' ? <CheckIcon /> : null}
            </DropdownItemButton>
            <DropdownItemButton onClick={() => {
              setSort('locked');
              window.api.store.write('sort', 'locked');
            }}>
              {t("Locked")} {sort == 'locked' ? <CheckIcon /> : null}
            </DropdownItemButton>
          </Dropdown.Menu>
        </Dropdown>
      </FilterBox>
      <Flex>
        {isEmpty(renderedFiles) ? null : (
          <AutoSizer>
            {({ width, height }) => (
              <Scrollbars style={{ width, height }}>
                <FilesBox>
                  {renderedFiles}
                </FilesBox>
              </Scrollbars>
            )}
          </AutoSizer>
        )}
      </Flex>
    </Background>
  );
}

export default withTranslation()(Files);
