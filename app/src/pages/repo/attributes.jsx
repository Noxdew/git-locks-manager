import React, { useEffect, useState } from "react";
import Box from "@primer/components/lib/Box";
import Tooltip from "@primer/components/lib/Tooltip";
import TextInput from "@primer/components/lib/TextInput";
import { ButtonInvisible as ButtonInvisibleRaw, ButtonOutline, ButtonPrimary as ButtonPrimaryRaw, ButtonClose as ButtonCloseRaw } from "@primer/components/lib/Button";
import styled from 'styled-components';
import { ThreeBarsIcon, CommentIcon, FileBadgeIcon, CheckCircleIcon, XCircleIcon } from '@primer/octicons-react';
import { get as themeGet } from '@primer/components/lib/constants';
import { withTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import { addError } from 'Redux/components/errors/errorsSlice';
import { NavLink } from "react-router-dom";
import ROUTES from "Constants/routes";
import { v4 as uuidv4 } from 'uuid';
import defaultRules from "Pages/repo/defaultGitAttr.json";
import update from 'immutability-helper';
import get from 'lodash/get';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const Background = styled(Box)`
  display: flex;
  flex: 1;
`;

const Content = styled(Box)`
  display: flex;
  flex: 1;
  padding: ${themeGet('space.2')};
  flex-direction: column;
`;

const TextBox = styled(Box)`
  & > span:not(:last-child) {
    padding-right: ${themeGet('space.1')};
  }
`;

const ButtonRow = styled(Box)`
  display: flex;
  flex-direction: row;
  margin-top: ${themeGet('space.4')};
  margin-bottom: ${themeGet('space.2')};

  & > *:not(:last-child) {
    margin-right: ${themeGet('space.2')};
  }
`;

const ButtonPrimary = styled(ButtonPrimaryRaw)`
  &:hover {
    color: ${themeGet('colors.btn.primary.text')};
  }
`;

const FormBox = styled(Box)`
  display: flex;
  flex-direction: column;
  margin-top: ${themeGet('space.2')};
`;

const CommentBox = styled(Box)`
  display: flex;
  margin-top: ${themeGet('space.2')};
  margin-bottom: ${themeGet('space.2')};

  & > span {
    display: flex;
  }

  & svg {
    margin-right: ${themeGet('space.2')};
    align-self: center;
  }
`;

const PatternBox = styled(Box)`
  display: flex;
  margin-bottom: ${themeGet('space.2')};

  & > span {
    display: flex;
  }

  & svg {
    margin-right: ${themeGet('space.2')};
    align-self: center;
  }
`;

const ButtonInvisible = styled(ButtonInvisibleRaw)`
  padding-right: 0;

  & > svg {
    margin-right: ${themeGet('space.2')};
  }
`;

const ButtonClose = styled(ButtonCloseRaw)`
  margin-left: ${themeGet('space.2')};
`;

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

function GitAttributes(props) {
  const { repoid } = useParams();
  const repos = useSelector((state) => state.repos.list);
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [needsSaving, setNeedsSaving] = useState(false);
  const [rules, setRules] = useState([]);

  let repo;
  if (repoid) {
    repo = repos.find(r => r.id === repoid);
  } else {
    repo = undefined;
  }

  useEffect(() => {
    setIsLoading(true);
    window.api.git.readGitAttributes(repo.path)
      .then(rules => {
        setRules(rules.map(r => ({ ...r, id: uuidv4() })));
      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => setIsLoading(false));
  }, [repoid]);

  if (!repo) {
    history.push('/');
    return null;
  }

  const save = () => {
    setIsLoading(true);
    window.api.git.createGitAttributes(repo.path, rules)
      .then(() => setNeedsSaving(false))
      .catch(err => dispatch(addError(err.message || err)))
      .finally(() => setIsLoading(false));
  }

  const onDragEnd = (result) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    const items = reorder(
      rules,
      result.source.index,
      result.destination.index
    );

    setNeedsSaving(true);
    setRules(items);
  }

  const { t } = props;
  return (
    <Background bg="bg.primary">
      <Content>
        <TextBox>
          <span>{t("The Git Attributes file is used to configure how Git treats different file formats.")}</span>
          <span>{t("This form can help you configure a basic Large File Storage and File Locking.")}</span>
          <span>{t("You can edit the file in a text editor should you need a more complex configuration.")}</span>
        </TextBox>
        <ButtonRow>
          <ButtonPrimary
            onClick={() => {
              setNeedsSaving(true);
              setRules(defaultRules.map(r => ({ ...r, id: uuidv4() })));
            }}
            disabled={isLoading}
          >{t('Apply Default Configuration')}</ButtonPrimary>
        </ButtonRow>
        <FormBox>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="droppable">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {rules.map((rule, i) => (
                    <Draggable key={rule.id} draggableId={rule.id} index={i}>
                      {(provided, snapshot) => {
                        if (typeof rule.pattern === 'string') {
                          return (
                            <PatternBox key={rule.id} ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                              <Tooltip aria-label={t("Drag to reorder")} direction="e"><ThreeBarsIcon size={16} /></Tooltip>
                              <Tooltip aria-label={t("File Pattern")} direction="e"><FileBadgeIcon size={16} /></Tooltip>
                              <TextInput disabled={isLoading} aria-label={t("File Pattern")} name="pattern" placeholder={t('File Pattern')} value={rule.pattern || ''} onChange={({ target: { value } }) => {
                                setNeedsSaving(true);
                                setRules(update(rules, { [i]: { pattern: { $set: value } } }));
                              }} />
                              <ButtonInvisible disabled={isLoading} onClick={() => {
                                setNeedsSaving(true);
                                const newValueFilter = get(rule, 'attrs.filter') === 'lfs' ? undefined : 'lfs';
                                setRules(update(rules, {
                                  [i]: {
                                    attrs: {
                                      filter: { $set: newValueFilter },
                                      diff: { $set: newValueFilter },
                                      merge: { $set: newValueFilter },
                                      text: { $set: get(rule, 'attrs.filter') === 'lfs' ? undefined : false },
                                    },
                                  },
                                }));
                              }}>
                                {get(rule, 'attrs.filter') === 'lfs' ? (
                                  <>
                                    <CheckCircleIcon size={16} />
                                    {t('Stored in LFS')}
                                  </>
                                ) : (
                                  <>
                                    <XCircleIcon size={16} />
                                    {t('Stored in Git')}
                                  </>
                                )}
                              </ButtonInvisible>
                              <ButtonInvisible disabled={isLoading} onClick={() => {
                                setNeedsSaving(true);
                                setRules(update(rules, { [i]: { attrs: { lockable: { $set: get(rule, 'attrs.lockable') ? undefined : true } } } }));
                              }}>
                                {get(rule, 'attrs.lockable') ? (
                                  <>
                                    <CheckCircleIcon size={16} />
                                    {t('Lockable')}
                                  </>
                                ) : (
                                  <>
                                    <XCircleIcon size={16} />
                                    {t('Not lockable')}
                                  </>
                                )}
                              </ButtonInvisible>
                              <Tooltip aria-label={t("Remove row")} direction="e"><ButtonClose onClick={() => {
                                setNeedsSaving(true);
                                setRules(update(rules, { $splice: [[i, 1]] }));
                              }} /></Tooltip>
                            </PatternBox>
                          );
                        }
                        return (
                          <CommentBox key={rule.id} ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                            <Tooltip aria-label={t("Drag to reorder")} direction="e"><ThreeBarsIcon size={16} /></Tooltip>
                            <Tooltip aria-label={t("Comment")} direction="e"><CommentIcon size={16} /></Tooltip>
                            <TextInput disabled={isLoading} aria-label={t("Comment")} name="comment" placeholder={t('Comment')} value={rule.comment || ''} onChange={({ target: { value } }) => {
                              setNeedsSaving(true);
                              setRules(update(rules, { [i]: { comment: { $set: value } } }));
                            }} />
                            <Tooltip aria-label={t("Remove row")} direction="e"><ButtonClose onClick={() => {
                              setNeedsSaving(true);
                              setRules(update(rules, { $splice: [[i, 1]] }));
                            }} /></Tooltip>
                          </CommentBox>
                        );
                      }}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
            {/* {rules.map((rule, i) => {

            })} */}
          </DragDropContext>
        </FormBox>
        <ButtonRow>
          <ButtonPrimary disabled={isLoading} onClick={() => {
            setNeedsSaving(true);
            setRules(update(rules, {
              $push: [{
                pattern: null,
                attrs: null,
                comment: '',
                id: uuidv4(),
              }]
            }));
          }}>{t('Add Comment')}</ButtonPrimary>
          <ButtonPrimary disabled={isLoading} onClick={() => {
            setNeedsSaving(true);
            setRules(update(rules, {
              $push: [{
                pattern: '',
                attrs: {
                  filter: 'lfs',
                  diff: 'lfs',
                  merge: 'lfs',
                  text: false,
                  lockable: true,
                },
                comment: null,
                id: uuidv4(),
              }]
            }));
          }}>{t('Add Rule')}</ButtonPrimary>
          {needsSaving ? (
            <ButtonPrimary disabled={isLoading} onClick={save}>{t('Save')}</ButtonPrimary>
          ) : null}
          <ButtonOutline disabled={isLoading} as={NavLink} to={ROUTES.REPO.replace(':repoid', repoid)}>{t('Back')}</ButtonOutline>
        </ButtonRow>
      </Content>
    </Background >
  );
}

export default withTranslation()(GitAttributes);
