import React from "react";
import styled from 'styled-components'
import { useSelector, useDispatch } from 'react-redux';
import Box from '@primer/components/lib/Box';
import Flash from '@primer/components/lib/Flash';
import { ButtonClose } from '@primer/components/lib/Button';
import { AlertIcon } from '@primer/octicons-react'
import { get as themeGet } from '@primer/components/lib/constants';
import { removeError } from 'Redux/components/errors/errorsSlice';


const ErrorsContainer = styled(Box)`
  position: absolute;
  display: flex;
  width: 100%;
  height: 100%;
  pointer-events: none;
  flex-direction: column;
  justify-content: flex-end;
  z-index: 1;

  & > * {
    align-self: center;
  }
`;

const ErrorBox = styled(Flash)`
  pointer-events: auto;
  margin-bottom: ${themeGet('space.2')};
`;

const Close = styled(ButtonClose)`
  & > svg {
    margin: 0;
    margin-left: ${themeGet('space.2')};
  }
`;

export default function Errors() {
  const errors = useSelector((state) => state.errors.list);
  const dispatch = useDispatch();

  return (
    <ErrorsContainer>
      {errors.map(err => (
        <ErrorBox variant="danger" key={err}>
          <AlertIcon size={16} />
          {err}
          <Close onClick={() => dispatch(removeError(err))} />
        </ErrorBox>
      ))}
    </ErrorsContainer>
  );
}
