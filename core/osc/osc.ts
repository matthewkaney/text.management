/*
 * Adapted from the osc.js library
 *
 * Derivative portions Copyright 2014-2016, Colin Clark
 * Licensed under the MIT and GPL 3 licenses.
 */

import {
  OSCBundle,
  OSCMessage,
  OSCArgumentTag,
  OSCArgumentTagList,
  OSCArgumentInputValue,
  OSCArgumentValue,
  OSCArgumentValueList,
} from "./types.js";

import {
  writeInt32,
  readInt32,
  writeFloat32,
  readFloat32,
  writeString,
  readString,
  writeBlob,
  readBlob,
  readTimestamp,
} from "./atoms.js";

/**
 * Generate a binary OSC message with the given information
 *
 * @param address - The OSC address is used to indicate to the receiver how the
 *     message should be handled. It begins with a slash, like a URL path
 * @param args - Any number of variables to be passed as arguments to the message. These
 *     can be raw values, or objects of the form `{ [type]: [value] }`, such as `{ i: 10 }`
 *
 * @return The binary data representing this OSC message
 */
export function message(address: string, ...args: OSCArgumentInputValue[]) {
  // Basic address check
  if (!(address.indexOf("/") === 0)) {
    throw Error(
      `An OSC message must contain a valid address. Address was: ${address}`
    );
  }

  // Write arguments
  let [argTypes, argData] = writeArguments(args);

  return mergeBuffers(
    writeString(address),
    writeString(`,${argTypes}`),
    ...argData
  );
}

/**
 * Generate a binary OSC bundle. A bundle allows OSC messages to be synchronized
 * to a timestamp. A bundle can contain any number of packets, which are other OSC
 * messages or bundles. This can be achieved by nesting `bundle` and `message`
 * function, for example `bundle(1.0, message('/synth', 'sine', 440))`
 *
 * @param time - The timestamp that this bundle should be executed
 * @param packets - The binary data for the messages or bundles contained within this
 *     bundle
 *
 * @return The binary data representing this OSC bundle
 */
export function bundle(time: Date | number, ...packets: Uint8Array[]) {
  let bundleParts = [writeString("#bundle"), new Uint8Array(8)];

  // Each packet starts with its 32-bit length
  for (let packet of packets) {
    bundleParts.push(writeInt32(packet.length));
    bundleParts.push(packet);
  }

  return mergeBuffers(...bundleParts);
}

/**
 * Parse an OSC buffer
 *
 * @param data -
 */
export function parse(data: Uint8Array): OSCBundle | OSCMessage {
  let address: string;
  [address, data] = readString(data);

  if (address === "#bundle") {
    // OSC Bundle

    // Read timestamp
    let ntpTime;
    [ntpTime, data] = readTimestamp(data);

    let packets: (OSCBundle | OSCMessage)[] = [];

    while (data.length > 0) {
      let packetSize;
      [packetSize, data] = readInt32(data);

      if (data.length < packetSize) {
        throw Error("Unexpected end of bundle");
      }

      packets.push(parse(data.subarray(0, packetSize)));
      data = data.subarray(packetSize);
    }

    return { time: 0, ntpTime, packets };
  } else if (address[0] === "/") {
    // OSC Message
    let types;
    [types, data] = readString(data);

    if (types === "") {
      // Some implementations leave the type string off
      return { address, args: [], argTypes: [] };
    } else {
      // Slice off the leading comma
      types = types.slice(1);
      let [argTypes, args] = readArguments(types, data);
      return { address, args, argTypes };
    }
  } else {
    throw Error(`Data is neither an OSC message or bundle`);
  }
}

/**
 * Concatenates a series of Uint8Arrays into a single array. This
 * is equivalent to `Uint8Array.of(...elements)`, but necessary because
 * that function currently doesn't exist in Safari. All data buffers
 * in OSC must be an even multiple of four bytes long, so this function
 * also checks the resulting size accordingly.
 *
 * @param elements A series of arrays of binary data to be combined
 * @returns A new array of data, combined from the inputs and guaranteed
 * to have a length that's an even multiple of four
 */
function mergeBuffers(...elements: Uint8Array[]) {
  let size = 0;

  // One pass to calculate the total size
  for (let element of elements) {
    size += element.byteLength;
  }

  // Check that size is a multiple of 4
  if (size % 4 !== 0) {
    throw Error(
      `An OSC message or bundle must have a size that's a multiple of 4.`
    );
  }

  let output = new Uint8Array(size);
  let offset = 0;

  // One pass to combine all of the arrays
  for (let element of elements) {
    output.set(element, offset);
    offset += element.length;
  }

  return output;
}

// ARGUMENTS
function readArguments(
  typeString: string,
  data: Uint8Array,
  nested = false
): [OSCArgumentTagList, OSCArgumentValueList, Uint8Array] {
  let argTypes: OSCArgumentTagList = [];
  let argValues: OSCArgumentValueList = [];

  for (let type of typeString) {
    let argValue: OSCArgumentValue;

    if (type === "i") {
      argTypes.push(type);
      [argValue, data] = readInt32(data);
      argValues.push(argValue);
    } else if (type === "f") {
      argTypes.push(type);
      [argValue, data] = readFloat32(data);
      argValues.push(argValue);
    } else if (type === "s") {
      argTypes.push(type);
      [argValue, data] = readString(data);
      argValues.push(argValue);
    } else if (type === "b") {
      argTypes.push(type);
      [argValue, data] = readBlob(data);
      argValues.push(argValue);
    } else {
      throw Error(
        `Unrecognized argument type "${type}" (${type.codePointAt(0)})`
      );
    }
    // } else {
    //   // Check if the current character is the start of an array
    //   if (type === '[') {
    //     parseStack.push([]);
    //   } else if (type === ']' && parseStack.length > 1) {
    //     let array = parseStack.pop();
    //     if (array) {
    //       add(array);
    //     }
    //   } else {
    //     throw Error(`Unrecognized argument type ${type}`);
    //   }
    // }
  }

  if (nested) {
    throw Error();
  }

  return [argTypes, argValues, data];
}

function writeArguments(args: OSCArgumentInputValue[]): [string, Uint8Array[]] {
  let typeString = "";
  let argData: Uint8Array[] = [];

  for (let arg of args) {
    // Infer types for various values
    if (typeof arg === "number") {
      arg = { f: arg };
    } else if (typeof arg === "string") {
      arg = { s: arg };
    } else if (arg instanceof ArrayBuffer || ArrayBuffer.isView(arg)) {
      arg = { b: arg };
    } else if (typeof arg === "boolean") {
      arg = arg ? { T: true } : { F: true };
    } else if (arg === undefined || arg === null) {
      arg = { N: true };
    }

    // Nested list of args
    if (Array.isArray(arg)) {
      let [listTypes, listArgData] = writeArguments(arg);
      typeString += `[${listTypes}]`;
      argData.push(...listArgData);
    }
    // Int 32
    else if (isTagged(arg, "i") && typeof arg.i === "number") {
      typeString += "i";
      argData.push(writeInt32(arg.i));
    }
    // Float 32
    else if (isTagged(arg, "f") && typeof arg.f === "number") {
      typeString += "f";
      argData.push(writeFloat32(arg.f));
    }
    // String
    else if (isTagged(arg, "s") && typeof arg.s === "string") {
      typeString += "s";
      argData.push(writeString(arg.s));
    }
  }

  return [typeString, argData];
}

function isTagged(
  object: any,
  type: OSCArgumentTag
): object is { [k in typeof type]: any } {
  return (
    typeof object === "object" &&
    object !== null &&
    Object.keys(object).length === 1 &&
    Object.keys(object)[0] === type
  );
}
