import React from 'react';
import { Button, themeGet } from '@primer/react';
import { XIcon } from '@primer/octicons-react';

export default React.forwardRef((props, ref) => (
  <Button
    variant="invisible"
    ref={ref}
    {...props}
  >
    <XIcon size={24} />
  </Button>
));
