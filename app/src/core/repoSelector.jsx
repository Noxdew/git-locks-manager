import React, { useState, useEffect, useRef } from "react";
import { withTranslation } from "react-i18next";
import { useSelector, useDispatch } from 'react-redux';
import { toggle, addRepo, removeRepo, setRepos } from 'Redux/components/repos/reposSlice';
import { addError } from 'Redux/components/errors/errorsSlice';
import { Box, TextInput, SideNav, Text, Dialog, Button, themeGet } from '@primer/react';
import styled from 'styled-components';
import isEmpty from 'lodash/isEmpty';
import lowerCase from 'lodash/lowerCase';
import { ArrowUpIcon, TrashIcon, FilterIcon } from '@primer/octicons-react';
import { v4 as uuidv4 } from 'uuid';
import { NavLink, useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import State from 'Components/state/State';
import { reorder } from 'Core/utils';
import MenuBar from 'Core/menuBar';
import { Scrollbars } from "react-custom-scrollbars-2";
import { AutoSizer } from "react-virtualized";
import { writeConfigRequest, readConfigRequest, readConfigResponse } from "secure-electron-store";
import CloseButton from 'Components/close-button/CloseButton';

const OverflowContainer = styled(Box)`
  position: absolute;
  padding-top: ${50 + MenuBar.height}px;
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 99;
`;

const RepoContainer = styled(Box)`
  width: 250px;
  background: ${themeGet('colors.canvas.subtle')};
  pointer-events: auto;
  display: flex;
  flex-direction: column;
`;

const BlackFill = styled(Box)`
  flex: 1;
  background: ${themeGet('colors.selectMenu.tapHighlight')};
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

  & svg {
    margin-left: ${themeGet('space.2')};
    margin-right: 0;
  }

  & input {
    padding-left: 0;
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

const Flex = styled(Box)`
  display: flex;
`;

const SideNavElement = styled(SideNav)`
  border-radius: 0;
  border: 0;
  border-top: 1px solid ${themeGet('colors.border.subtle')} !important;
`;

const SideNavLink = styled(SideNav.Link)`
  border-bottom: 1px solid ${themeGet('colors.border.subtle')} !important;
  border-top: 0 !important;
  text-decoration:none;

  &.dragged {
    border-top: 1px solid ${themeGet('colors.border.subtle')} !important;
  }

  &:first-child {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }

  &:last-child {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
`;

const StyledCloseButton = styled(CloseButton)`
  color: ${themeGet('colors.btn.text')} !important;
`;

const StyledTrashIcon = styled(TrashIcon)`
  align-self: center;
  margin-right: ${themeGet('space.2')};
`;

const RepoNavList = styled(Box)`
  flex: 1;
`;

function RepoSelector(props) {
  const isOpen = useSelector((state) => state.repos.selectorOpen);
  const repos = useSelector((state) => state.repos.list);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const reposRef = useRef([]);

  const [filter, setFilter] = useState('');

  useEffect(() => {
    reposRef.current = repos;
  }, [repos])

  useEffect(() => {
    window.api.store.onReceive(readConfigResponse, function(args){
      if (args.success && args.key === "repos") {
        dispatch(setRepos(args.value));
      }
    });
    window.api.store.send(readConfigRequest, "repos");

    window.api.ipc.on('add-repo', (e, { path }) => {
      if (!path) {
        return;
      }
      window.api.git.getRepoName(path)
        .then(name => {
          const prevRepo = reposRef.current.find(r => r.path === path);
          if (prevRepo) {
            dispatch(addError(t('Repository already added')));
            return;
          }

          const repo = {
            id: uuidv4(),
            path,
            name,
          };
          const newArray = [...reposRef.current, repo];
          window.api.store.send(writeConfigRequest, 'repos', newArray);
          dispatch(addRepo(repo));
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

  const onDragEnd = (result) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    const items = reorder(
      repos,
      result.source.index,
      result.destination.index
    );

    dispatch(setRepos(items));
    window.api.store.send(writeConfigRequest, 'repos', items);
  };

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
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="reposDroppable">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              <SideNavElement aria-label={t("Select Repository")} bordered>
                {repos.filter(({ name }) => lowerCase(name).includes(lowerCase(filter)))
                  .map(({ id, path, name }, i) => (
                    <Draggable key={id} draggableId={id} index={i}>
                      {(provided, snapshot) => (
                        <SideNavLink as={NavLink} to={`/${id}`} variant="full" key={id} ref={provided.innerRef} className={snapshot.isDragging ? 'dragged' : ''} {...provided.draggableProps} {...provided.dragHandleProps}>
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
                                        <Button sx={{ marginRight: 1 }} onClick={() => setIsOpen(false)}>{t('Cancel')}</Button>
                                        <Button
                                          variant="danger"
                                          onClick={() => {
                                            dispatch(removeRepo(id));
                                            window.api.store.send(writeConfigRequest, 'repos', repos.filter(r => r.id !== id));
                                            navigate('/');
                                          }}
                                        >
                                          {t('Remove')}
                                        </Button>
                                      </Flex>
                                    </Box>
                                  </Dialog>
                                  <StyledCloseButton ref={returnFocusRef} onClick={() => setIsOpen(true)} />
                                </>
                              )
                            }}
                          </State>
                        </SideNavLink>
                      )}
                    </Draggable>
                  ))}
              </SideNavElement>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
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
        <RepoNavList>
          <AutoSizer>
            {({ width, height }) => (
              <Scrollbars style={{ width, height }}>
                {list}
              </Scrollbars>
            )}
          </AutoSizer>
        </RepoNavList>
      </RepoContainer>
      <BlackFill onClick={() => dispatch(toggle())} />
    </OverflowContainer>
  );
}

export default withTranslation()(RepoSelector);
