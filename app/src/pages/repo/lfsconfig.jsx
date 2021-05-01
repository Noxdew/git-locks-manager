import React, { useEffect, useState } from "react";
import Box from "@primer/components/lib/Box";
import Dropdown from "@primer/components/lib/Dropdown";
import FormGroup from "@primer/components/lib/FormGroup";
import TextInputRaw from "@primer/components/lib/TextInput";
import { ButtonDanger, ButtonInvisible as ButtonInvisibleRaw, ButtonOutline, ButtonPrimary as ButtonPrimaryRaw } from "@primer/components/lib/Button";
import styled from 'styled-components';
import { XCircleIcon, CheckCircleIcon } from '@primer/octicons-react';
import { get as themeGet } from '@primer/components/lib/constants';
import { withTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import { addError } from 'Redux/components/errors/errorsSlice';
import { NavLink } from "react-router-dom";
import ROUTES from "Constants/routes";
import { Scrollbars } from "react-custom-scrollbars";
import { AutoSizer } from "react-virtualized";

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
  & > *:not(:last-child) {
    margin-right: ${themeGet('space.1')};
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

const TextInput = styled(TextInputRaw)`
  width: 100%;
`;

const ButtonInvisible = styled(ButtonInvisibleRaw)`
  padding-left: 0;
  padding-right: 0;

  & > svg {
    margin-right: ${themeGet('space.2')};
  }
`;

function LFSConfig(props) {
  const { repoid } = useParams();
  const repos = useSelector((state) => state.repos.list);
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);
  const [remote, setRemote] = useState('');
  const [remotes, setRemotes] = useState([]);
  const [url, setUrl] = useState('');
  const [useAuth, setUseAuth] = useState(false);
  const [needsSaving, setNeedsSaving] = useState(false);

  let repo;
  if (repoid) {
    repo = repos.find(r => r.id === repoid);
  } else {
    repo = undefined;
  }

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      window.api.git.readLfsconfig(repo.path)
        .then(data => {
          let rem;
          let url;
          let auth = false;
          Object.keys(data).forEach(key => {
            if (key.startsWith('remote ')) {
              rem = key.substring(8, key.length - 1);
              url = data[key].lfsurl;
            } else if (key.startsWith('lfs ')) {
              let fullKey = key;
              let cursor = data[key];
              while (!fullKey.endsWith('"')) {
                const nextKey = Object.keys(cursor)[0];
                if (!nextKey) {
                  break;
                }

                fullKey += `.${nextKey}`;
                cursor = cursor[nextKey];
              }
              if (cursor) {
                auth = !!cursor.access;
              }
            }
          });

          if (rem && url) {
            setUrl(url);
            setRemote(rem);
            setUseAuth(auth);
            setHasConfig(true);
          }
        })
        .catch(err => {
          setHasConfig(false);
        }),
      window.api.git.remotes(repo.path)
        .then(setRemotes)
        .catch(() => dispatch(addError(err.message || err))),
    ])
      .finally(() => setIsLoading(false));
  }, [repoid]);

  if (!repo) {
    history.push('/');
    return null;
  }

  if (!remote && remotes[0]) {
    setRemote(remotes[0]);
  }

  const save = () => {
    const data = {};
    if (hasConfig) {
      if (!url) {
        dispatch(addError(t('The server URL is required')));
        return;
      }

      data.remote = remote;
      data.url = url;
      data.auth = useAuth;
    }

    setIsLoading(true);
    window.api.git.createLfsconfig(repo.path, data)
      .then(() => setNeedsSaving(false))
      .catch(err => dispatch(addError(err.message || err)))
      .finally(() => setIsLoading(false))
  }

  const { t } = props;
  return (
    <Background bg="bg.primary">
      <AutoSizer>
        {({ width, height }) => (
          <Scrollbars style={{ width, height }}>
            <Content>
              <TextBox>
                <span>{t("Git Large File Storage (LFS) replaces large files such as audio samples, videos, datasets, and graphics with text pointers inside Git, while storing the file contents on a remote server.")}</span>
                <span>{t("Most Git providers (like GitHub.com) support LFS and require no configuration at all. However, if you are using a third party server you can use the form below to configure your repository to use it.")}</span>
              </TextBox>
              <ButtonRow>
                {hasConfig ? (
                  <ButtonDanger
                    onClick={() => {
                      setNeedsSaving(true);
                      setHasConfig(!hasConfig);
                    }}
                    disabled={isLoading}
                  >{t('Remove Custom Config')}</ButtonDanger>
                ) : (
                  <ButtonPrimary
                    onClick={() => {
                      setNeedsSaving(true);
                      setHasConfig(!hasConfig);
                    }}
                    disabled={isLoading}
                  >{t('Use Custom Config')}</ButtonPrimary>
                )}
                {needsSaving ? (
                  <ButtonPrimary disabled={isLoading} onClick={save}>{t('Save')}</ButtonPrimary>
                ) : null}
                <ButtonOutline disabled={isLoading} as={NavLink} to={ROUTES.REPO.replace(':repoid', repoid)}>{t('Back')}</ButtonOutline>
              </ButtonRow>
              {hasConfig ? (
                <>
                  <FormBox>
                    <FormGroup>
                      <FormGroup.Label htmlFor="remote-dropdown">{t('Select remote')}</FormGroup.Label>
                      <Dropdown id='remote-dropdown'>
                        <Dropdown.Button disabled={isLoading}>{remote || t('Select remote')}</Dropdown.Button>
                        <Dropdown.Menu direction='se'>
                          {remotes.map(rem => (
                            <Dropdown.Item key={rem} onClick={() => {
                              setRemote(rem);
                              setNeedsSaving(true);
                            }}>{rem}</Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </FormGroup>
                    <FormGroup>
                      <FormGroup.Label htmlFor="lfs-url">{t('Full Git LFS Server URL')}</FormGroup.Label>
                      <TextInput id="lfs-url" placeholder={`https://<server>/<owner>/${repo.name}.git/info/lfs/`} value={url} onChange={({ target: { value } }) => {
                        setUrl(value);
                        setNeedsSaving(true);
                      }} />
                    </FormGroup>
                    <FormGroup>
                      <FormGroup.Label htmlFor="lfs-auth">{t('Authentication')}</FormGroup.Label>
                      <ButtonInvisible
                        id="lfs-auth"
                        disabled={isLoading}
                        onClick={() => {
                          setUseAuth(!useAuth);
                          setNeedsSaving(true);
                        }}
                      >
                        {useAuth ? (
                          <>
                            <CheckCircleIcon size={16} />
                            {t('With Authentication')}
                          </>
                        ) : (
                          <>
                            <XCircleIcon size={16} />
                            {t('Without Authentication')}
                          </>
                        )}
                      </ButtonInvisible>
                    </FormGroup>

                  </FormBox>
                  <ButtonRow>
                    {needsSaving ? (
                      <ButtonPrimary disabled={isLoading} onClick={save}>{t('Save')}</ButtonPrimary>
                    ) : null}
                    <ButtonOutline disabled={isLoading} as={NavLink} to={ROUTES.REPO.replace(':repoid', repoid)}>{t('Back')}</ButtonOutline>
                  </ButtonRow>
                </>
              ) : null}
            </Content>
          </Scrollbars>
        )}
      </AutoSizer>
    </Background>
  );
}

export default withTranslation()(LFSConfig);
