import React from "react";
import styled from 'styled-components'
import { useSelector, useDispatch } from 'react-redux';
import { Box, themeGet } from '@primer/react';
import { Banner } from '@primer/react/experimental';
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

const ErrorBox = styled(Banner)`
  pointer-events: auto;
  margin-bottom: ${themeGet('space.2')};
`;

export default function Errors() {
  const errors = useSelector((state) => state.errors.list);
  const dispatch = useDispatch();

  return (
    <ErrorsContainer>
      {errors.map((err, index) => (
        // Critical banners currently don't allow dismiss action
        <ErrorBox variant="warning" key={`${index}-${err}`} title={err} onDismiss={() => dispatch(removeError(err))} />
      ))}
    </ErrorsContainer>
  );
}
