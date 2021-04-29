import React, { useState, useEffect } from "react";
import { withTranslation } from "react-i18next";
import { useSelector, useDispatch } from 'react-redux';
import { toggle, addRepo, removeRepo } from 'Redux/components/repos/reposSlice';
import { addError } from 'Redux/components/errors/errorsSlice';
import Box from '@primer/components/lib/Box';
import TextInput from '@primer/components/lib/TextInput';
import Button, { ButtonClose, ButtonDanger } from '@primer/components/lib/Button';
import SideNav from '@primer/components/lib/SideNav';
import Text from '@primer/components/lib/Text';
import Dialog from '@primer/components/lib/Dialog';
import Flex from '@primer/components/lib/Flex';
import styled from 'styled-components';
import { get as themeGet } from '@primer/components/lib/constants';
import isEmpty from 'lodash/isempty';
import lowerCase from 'lodash/lowerCase';
import { ArrowUpIcon, TrashIcon, FilterIcon } from '@primer/octicons-react';
import { v4 as uuidv4 } from 'uuid';
import { writeConfigRequest } from "secure-electron-store";
import { NavLink, useHistory } from "react-router-dom";
import State from 'Components/state/State';

const OverflowContainer = styled(Box)`
  position: absolute;
  padding-top: 50px;
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
`;

const RepoContainer = styled(Box)`
  width: 250px;
  background: ${themeGet('colors.bg.primary')};
  pointer-events: auto;
`;

const BlackFill = styled(Box)`
  flex: 1;
  background: ${themeGet('colors.bg.backdrop')};
  pointer-events: auto;
`;

const FilterRow = styled(Box)`
  display: flex;
  flex-direction: row;
  margin: ${themeGet('space.2')};

  & > span {
    margin: 0;
    margin-right: ${themeGet('space.2')};
  }
`;

const EmptyReposBox = styled(Box)`
  display: flex;
  flex-direction: row;
  margin: ${themeGet('space.3')};
  justify-content: space-between;

  & > svg {
    margin-right: ${themeGet('space.2')};
  }
`;

const SideNavElement = styled(SideNav)`
  border-radius: 0;
`;

const StyledTrashIcon = styled(TrashIcon)`
  align-self: center;
  margin-right: ${themeGet('space.2')};
`;

function RepoSelector(props) {
  const isOpen = useSelector((state) => state.repos.selectorOpen);
  const repos = useSelector((state) => state.repos.list);
  const dispatch = useDispatch();
  const history = useHistory();

  const [filter, setFilter] = useState('');

  useEffect(() => {
    window.api.ipc.on('add-repo', (e, { path }) => {
      if (!path) {
        return;
      }
      window.api.git.getRepoName(path)
        .then(name => {
          const prevRepo = repos.find(r => r.path === path);
          if (prevRepo) {
            dispatch(addError(t('Repository already added')));
            return;
          }

          const repo = {
            id: uuidv4(),
            path,
            name,
          };
          dispatch(addRepo(repo));
          const newArray = [...repos, repo];
          window.api.store.send(writeConfigRequest, 'repos', newArray);
        })
        .catch(err => {
          console.error(err);
          dispatch(addError(t('The folder was not identified as Git Repository')));
        });
    });

    return () => {
      window.api.ipc.removeAllListeners('add-repo');
    };
  }, []);

  const { t } = props;

  if (!isOpen) {
    if (filter) {
      setFilter('');
    }
    return null;
  }

  let list;
  if (isEmpty(repos)) {
    list = (
      <EmptyReposBox>
        {t("Add a repository")}
        <ArrowUpIcon size={24} />
      </EmptyReposBox>
    );
  } else {
    list = (
      <SideNavElement aria-label={t("Select Repository")} bordered>
        {repos
          .filter(({ name }) => lowerCase(name).includes(lowerCase(filter)))
          .map(({ id, path, name }) => (
          <SideNav.Link as={NavLink} to={`/${id}`} variant="full" key={id}>
            <Text title={path}>{name}</Text>

            <State default={false}>
              {([isOpen, setIsOpen]) => {
                const returnFocusRef = React.useRef(null)
                return (
                  <>
                    <Dialog isOpen={isOpen} returnFocusRef={returnFocusRef} onDismiss={() => setIsOpen(false)} aria-labelledby="label">
                      <Dialog.Header>
                        <StyledTrashIcon />
                        {t("Remove")} {name}
                      </Dialog.Header>
                      <Box p={3}>
                        <Text id="label" fontFamily="sans-serif">{t('Are you sure you would like to remove this repository?')}</Text>
                        <Flex mt={3} justifyContent="flex-end">
                          <Button mr={1} onClick={() => setIsOpen(false)}>{t('Cancel')}</Button>
                          <ButtonDanger onClick={() => {
                            dispatch(removeRepo(id));
                            window.api.store.send(writeConfigRequest, 'repos', repos.filter(r => r.id !== id));
                            history.push('/');
                          }}>
                            {t('Remove')}
                          </ButtonDanger>
                        </Flex>
                      </Box>
                    </Dialog>
                    <ButtonClose ref={returnFocusRef} onClick={() => setIsOpen(true)} />
                  </>
                )
              }}
            </State>
          </SideNav.Link>
        ))}
      </SideNavElement>
    );
  }

  return (
    <OverflowContainer>
      <RepoContainer>
        <FilterRow>
          <TextInput
            aria-label={t("Filter")}
            name="filter"
            placeholder={t("Filter")}
            icon={FilterIcon}
            onChange={({ target: { value } }) => setFilter(value)}
          />
          <Button
            onClick={() => {
              window.api.ipc.send('select-repo');
            }}
          >
            {t('Add')}
          </Button>
        </FilterRow>
        {list}
      </RepoContainer>
      <BlackFill onClick={() => dispatch(toggle())} />
    </OverflowContainer>
  );
}

export default withTranslation()(RepoSelector);
