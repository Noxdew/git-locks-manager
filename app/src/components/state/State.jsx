import React, { useState } from "react";

export default function State(props) {
  const state = useState(props.default);
  return props.children(state);
}