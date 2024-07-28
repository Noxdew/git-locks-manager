import React, { useEffect, useState } from "react";
import { Box, themeGet } from '@primer/react';
import styled from 'styled-components';
import Ref from 'Components/ref/Ref';
import AppIcon from 'Images/logo.png';

const oldMacHeight = 22;
const bigSurHeight = 26;
const otherHeight = 28;

// Source https://github.com/desktop/desktop/blob/18238077aa1e4851e710cfa66587cd4fd597bacd/app/src/ui/window/window-controls.tsx#L12
const closePath =
  'M 0,0 0,0.7 4.3,5 0,9.3 0,10 0.7,10 5,5.7 9.3,10 10,10 10,9.3 5.7,5 10,0.7 10,0 9.3,0 5,4.3 0.7,0 Z'
const restorePath =
  'm 2,1e-5 0,2 -2,0 0,8 8,0 0,-2 2,0 0,-8 z m 1,1 6,0 0,6 -1,0 0,-5 -5,0 z m -2,2 6,0 0,6 -6,0 z'
const maximizePath = 'M 0,0 0,10 10,10 10,0 Z M 1,1 9,1 9,9 1,9 Z'
const minimizePath = 'M 0,5 10,5 10,6 0,6 Z'

const Bar = styled(Box)`
  -webkit-app-region: drag;
  flex-grow: 0;
  flex-shrink: 0;
  width: 100%;
  display: flex;
  flex-direction: row;
`;

const MacBar = styled(Bar)`
  height: ${window.api.env.isBitSurOrLater ? bigSurHeight : oldMacHeight}px;
  background: linear-gradient(to bottom, #3b3f46 0%, #2b2e33 100%);
`;

const LinuxBar = styled(Bar)`
  height: ${otherHeight}px;
  background: linear-gradient(to bottom, #3b3f46 0%, #2b2e33 100%);
`;

const WindowsBar = styled(Bar)`
  height: ${otherHeight}px;
  background: #24292e;
`;

const WindowsMiddleBar = styled.div`
  flex: 1;
`;

const WindowsButtonGroup = styled(Box)`
  & > button {
    -webkit-app-region: no-drag;
    height: 100%;
    border: none;
    border-radius: 0;
    box-shadow: none;
    background-color: transparent;
    line-height: 10px;
    transition: background-color .25s ease;
    color: #a0a0a0;
  }

  & > button > svg {
    fill: currentColor;
  }

  & > button > * {
    margin-left: ${themeGet('space.2')};
    margin-right: ${themeGet('space.2')};
  }

  & > button:hover {
    background-color: #888;
    color: #fff;
  }

  & > button.close, & > button.btncontrol {
    width: 45px;
  }

  & > button.close:hover {
    background-color: #e81123;
    color: #fff;
  }
`;

const ImageContainer = styled.div`
  height: 100%;
  padding: 5px;
  display: inline-block;

  & > img {
    height: 100%;
  }
`;

function MenuBar() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMaximised, setIsMaximised] = useState(false);
  const [menu, setMenu] = useState([]);

  useEffect(() => {
    window.api.ipc.on('is-fullscreen', (e, data) => {
      setIsFullscreen(!!data);
    });
    window.api.ipc.on('is-maximised', (e, data) => {
      setIsMaximised(!!data);
    });
    window.api.ipc.on('menu-update', (e, data) => {
      setMenu(data);
    });

    window.api.ipc.send('is-fullscreen');
    window.api.ipc.send('is-maximised');
    window.api.ipc.send('get-menu');

    return () => {
      window.api.ipc.removeAllListeners('is-fullscreen');
      window.api.ipc.removeAllListeners('is-maximised');
      window.api.ipc.removeAllListeners('menu-update');
    };
  }, [])

  if (isFullscreen) return null;

  if (window.api.env.mac) {
    return (
      <MacBar onDoubleClick={() => {
        window.api.ipc.send('title-bar-double-click');
      }}/>
    );
  } else if (window.api.env.linux) {
    return (
      <LinuxBar />
    );
  }

  return (
    <WindowsBar>
      <ImageContainer>
        <img src={AppIcon} alt="logo" />
      </ImageContainer>
      <WindowsButtonGroup>
        {menu.map(({ label }, index) => {
          return (
            <Ref key={index}>
              {(ref) => (
                <button ref={ref} onClick={() => {
                  const rect = ref.current.getBoundingClientRect();
                  window.api.ipc.send('open-menu', {
                    x: rect.x,
                    y: rect.y + rect.height,
                    index,
                  });
                }}>
                  {label}
                </button>
              )}
            </Ref>
          );
        })}
      </WindowsButtonGroup>
      <WindowsMiddleBar onDoubleClick={() => {
        window.api.ipc.send('title-bar-double-click');
      }} />
      <WindowsButtonGroup>
        <button className="btncontrol" onClick={() => window.api.ipc.send('minimize')}>
          <svg aria-hidden="true" version="1.1" width="10" height="10">
            <path d={minimizePath} />
          </svg>
        </button>
        <button className="btncontrol" onClick={() => window.api.ipc.send('maximize')}>
          <svg aria-hidden="true" version="1.1" width="10" height="10">
            <path d={isMaximised ? restorePath : maximizePath} />
          </svg>
        </button>
        <button className="close" onClick={() => window.api.ipc.send('close')}>
          <svg aria-hidden="true" version="1.1" width="10" height="10">
            <path d={closePath} />
          </svg>
        </button>
      </WindowsButtonGroup>
    </WindowsBar>
  );
}

if (window.api.env.mac) {
  MenuBar.height = window.api.env.isBitSurOrLater ? bigSurHeight : oldMacHeight;
} else {
  MenuBar.height = otherHeight;
}

export default MenuBar;