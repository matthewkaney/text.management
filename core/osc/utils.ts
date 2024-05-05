import { OSCPacket, OSCMessageWithTime, NTPTime } from "./types";

export function asMessages(packet: OSCPacket) {
  return asMessagesAtTime(packet, [0, 0]);
}

function asMessagesAtTime(
  packet: OSCPacket,
  ntpTime: NTPTime
): OSCMessageWithTime[] {
  if ("address" in packet) {
    return [{ ...packet, ntpTime }];
  } else {
    let { ntpTime: newTime, packets } = packet;
    return packets.flatMap((newPacket) => asMessagesAtTime(newPacket, newTime));
  }
}
