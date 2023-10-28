/**
 * These functions allow reading and writing the various atomic types supported by
 * OSC. Each type has two functions:
 *
 * * `write[Type]()`: Takes a value and returns a Uint8Array
 * * `read[Type]()`: Takes a Uint8Array of data and returns an array of [value, remainingData]
 *
 * @packageDocumentation
 */

import { TextEncoder, TextDecoder } from "util";

/**
 * Encode a 32-bit integer
 *
 * @param value The value to write
 * @returns A four-byte array containing the data
 */
export function writeInt32(value: number) {
  let output = new Uint8Array(4);
  new DataView(output.buffer).setInt32(0, value);
  return output;
}

/**
 * Read a 32-bit integer from data
 *
 * @param data The raw binary data of a message
 * @returns An array containing the numeric value and the remaining raw data
 */
export function readInt32(data: Uint8Array): [number, Uint8Array] {
  let value = new DataView(data.buffer).getInt32(data.byteOffset);
  return [value, data.subarray(4)];
}

/**
 * Encode a 32-bit floating-point number
 *
 * @param value The value to write
 * @returns A four-byte array containing the data
 */
export function writeFloat32(value: number) {
  let output = new Uint8Array(4);
  new DataView(output.buffer).setFloat32(0, value);
  return output;
}

/**
 * Read a 32-bit floating-point number from data
 *
 * @param data The raw binary data of a message
 * @returns An array containing the numeric value and the remaining raw data
 */
export function readFloat32(data: Uint8Array): [number, Uint8Array] {
  let value = new DataView(data.buffer).getFloat32(data.byteOffset);
  return [value, data.subarray(4)];
}

/**
 * Encode a string as an array of bytes
 *
 * @param str The string to be encoded
 * @returns An array of bytes. The length is guaranteed to be a multiple of four
 */
export function writeString(str: string) {
  let unterminatedBuffer = new TextEncoder().encode(str);
  let terminatedLength = chunkSize(unterminatedBuffer.length + 1);
  let buffer = new Uint8Array(terminatedLength);
  buffer.set(unterminatedBuffer);

  return buffer;
}

/**
 * Read an OSC-encoded string from data
 *
 * @param data The raw binary data of a message
 * @returns An array containing the string and the remaining raw data
 */
export function readString(data: Uint8Array): [string, Uint8Array] {
  let length = 0;

  // Look for the null terminating character
  while (length < data.length && data[length] !== 0) {
    length++;
  }

  // Decode this section of the data
  let text = new TextDecoder().decode(data.subarray(0, length));

  return [text, data.subarray(chunkSize(length + 1))];
}

/**
 * Encode a variable-length blob of data for an OSC message
 *
 * @param blob The binary data for the blob
 * @returns The binary data formatted for an OSC message, with the length
 * included and a length that's a multiple of 4
 */
export function writeBlob(blob: Uint8Array) {
  let output = new Uint8Array(chunkSize(4 + blob.length));

  // Write size followed by data
  new DataView(output.buffer).setInt32(0, blob.length);
  output.set(blob, 4);
  return output;
}

/**
 * Read a variable-length blob of binary data from an OSC message
 *
 * @param data The raw binary data of a message
 * @returns An array containing the data of the blob and the remaining raw data
 */
export function readBlob(data: Uint8Array): [Uint8Array, Uint8Array] {
  let size = new DataView(data.buffer).getInt32(data.byteOffset);
  let blob = data.subarray(4, size + 4);
  return [blob, data.subarray(chunkSize(size + 4))];
}

/**
 * Encode a 64-bit NTP timestamp
 *
 * @param value The value to write
 * @returns An eight-byte array containing the data
 */
export function writeTimestamp(value: [number, number]) {
  let output = new Uint8Array(8);
  let view = new DataView(output.buffer);
  view.setUint32(0, value[0]);
  view.setUint32(4, value[1]);
  return output;
}

/**
 * Read a 64-bit NTP timestamp from data
 *
 * @param data The raw binary data of a message
 * @returns An array containing the numeric value and the remaining raw data
 */
export function readTimestamp(
  data: Uint8Array
): [[number, number], Uint8Array] {
  let seconds = new DataView(data.buffer).getUint32(data.byteOffset);
  let fracSeconds = new DataView(data.buffer).getUint32(data.byteOffset + 4);
  return [[seconds, fracSeconds], data.subarray(8)];
}

/**
 * All types in OSC are aligned to be a multiple of four bytes. This
 * convenience function takes a number and returns the next largest
 * multiple of 4.
 *
 * @param numBytes - The number of bytes
 */
function chunkSize(bytes: number) {
  return (bytes + 3) & ~0x03;
}
