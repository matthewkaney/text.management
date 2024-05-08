import inputSVG from "bundle-text:@core/icons/console_input.svg";
import outputSVG from "bundle-text:@core/icons/console_output.svg";
import errorSVG from "bundle-text:@core/icons/console_error.svg";

export function InputIcon() {
  return <Icon svgSource={inputSVG} />;
}

export function OutputIcon() {
  return <Icon svgSource={outputSVG} />;
}

export function ErrorIcon() {
  return <Icon svgSource={errorSVG} />;
}

function Icon({ svgSource }: { svgSource: string }) {
  console.log(svgSource);
  return (
    <div
      class="cm-console-message-icon"
      innerHTML={{ __dangerousHtml: svgSource }}
    ></div>
  );
}
