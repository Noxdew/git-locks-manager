import React, { useRef } from "react";

export default function Ref(props) {
  const ref = useRef(props.default);
  return props.children(ref);
}
