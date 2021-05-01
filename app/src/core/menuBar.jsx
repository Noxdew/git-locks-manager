import React, { useEffect, useState } from "react";
import Box from '@primer/components/lib/Box';
import styled from 'styled-components';

const oldMacHeight = 22;
const bigSurHeight = 26;
const otherHeight = 28;

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

function MenuBar() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    window.api.ipc.on('is-fullscreen', (e, data) => {
      setIsFullscreen(!!data);
    });

    window.api.ipc.send('is-fullscreen');

    return () => {
      window.api.ipc.removeAllListeners('is-fullscreen');
    };
  }, [])

  if (window.api.env.mac) {
    if (isFullscreen) return null;

    return (
      <MacBar onDoubleClick={() => {
        window.api.ipc.send('mac-title-bar-double-click');
      }}/>
    );
  } else if (window.api.env.linux) {
    return (
      <LinuxBar />
    );
  }
  return (
    <WindowsBar />
  );
}

if (window.api.env.mac) {
  MenuBar.height = window.api.env.isBitSurOrLater ? bigSurHeight : oldMacHeight;
} else {
  MenuBar.height = otherHeight;
}

export default MenuBar;