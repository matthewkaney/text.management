/**
 * An object representing a complete OSC bundle.
 */
export interface OSCBundle {
  time: number;
  ntpTime: [number, number];
  packets: (OSCBundle | OSCMessage)[];
}

/**
 * An object representing a single OSC message.
 */
export interface OSCMessage {
  address: string;
  args: OSCArgumentValueList;
  argTypes: OSCArgumentTagList;
}

/**
 * The possible types that an individual OSC argument may have.
 */
export type OSCArgumentValue =
  | number
  | string
  | Uint8Array
  | BigInt
  | boolean
  | undefined
  | null;

/**
 * The list of all the values for an OSC message's arguments, allowing for
 * recursively-nested lists of values.
 */
export type OSCArgumentValueList = (OSCArgumentValue | OSCArgumentValueList)[];

/**
 * The set of all single-character OSC type strings that are recognized (excluding
 * "[" and "]", which are a special case.)
 */
const OSCArgumentTags = [
  "i",
  "f",
  "s",
  "b",
  "h",
  "t",
  "d",
  "S",
  "c",
  "r",
  "m",
  "T",
  "F",
  "N",
  "I",
] as const;

/**
 * Any one of those type strings.
 */
export type OSCArgumentTag = typeof OSCArgumentTags[number];

/**
 * The list of type strings for the arguments of an OSC message. An argument
 * tag list will have the same shape as the corresponding argument list, allowing
 * for the same types of nested lists.
 */
export type OSCArgumentTagList = (OSCArgumentTag | OSCArgumentTagList)[];

/**
 * Verify that a given string is a recognized type tag, such as "i" or "f".
 *
 * @param tag - The string to check
 */
export function isOSCArgumentTag(tag: string): tag is OSCArgumentTag {
  return OSCArgumentTags.includes(tag as OSCArgumentTag);
}

/**
 * The possible types that can be provided as an argument value. This allows
 * message senders to pass more types of data to values.
 */
export type OSCArgumentInputValue =
  | OSCArgumentValue
  | ArrayBuffer
  | ArrayBufferView
  | Date
  | { i: number }
  | { f: number }
  | { s: string }
  | { b: number | ArrayBuffer | ArrayBufferView }
  | { h: bigint | BigInt }
  | { t: number | [number | number] | Date }
  | { d: number }
  | { S: string }
  | { c: string }
  | { r: ArrayBuffer | ArrayBufferView }
  | { m: number[] | ArrayBuffer | ArrayBufferView }
  | { T: any }
  | { F: any }
  | { N: any }
  | { I: any };
