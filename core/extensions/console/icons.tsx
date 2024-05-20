import Input from "jsx:@core/icons/console_input.svg";
import Output from "jsx:@core/icons/console_output.svg";
import Error from "jsx:@core/icons/console_error.svg";

import { ComponentChildren } from "preact";

export function InputIcon() {
  return (
    <Icon>
      <Input />
    </Icon>
  );
}

export function OutputIcon() {
  return (
    <Icon>
      <Output />
    </Icon>
  );
}

export function ErrorIcon() {
  return (
    <Icon>
      <Error />
    </Icon>
  );
}

interface IconProps {
  children: ComponentChildren;
}

function Icon({ children }: IconProps) {
  return <div class="cm-console-message-icon">{children}</div>;
}
