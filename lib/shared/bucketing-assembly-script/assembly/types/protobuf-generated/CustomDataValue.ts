// Code generated by protoc-gen-as. DO NOT EDIT.
// Versions:
//   protoc-gen-as v1.3.0
//   protoc        v3.21.12

import { Writer, Reader, Protobuf } from "as-proto/assembly";
import { CustomDataType } from "./CustomDataType";

export class CustomDataValue {
  static encode(message: CustomDataValue, writer: Writer): void {
    writer.uint32(8);
    writer.int32(message.type);

    writer.uint32(16);
    writer.bool(message.boolValue);

    writer.uint32(25);
    writer.double(message.doubleValue);

    writer.uint32(34);
    writer.string(message.stringValue);
  }

  static decode(reader: Reader, length: i32): CustomDataValue {
    const end: usize = length < 0 ? reader.end : reader.ptr + length;
    const message = new CustomDataValue();

    while (reader.ptr < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.type = reader.int32();
          break;

        case 2:
          message.boolValue = reader.bool();
          break;

        case 3:
          message.doubleValue = reader.double();
          break;

        case 4:
          message.stringValue = reader.string();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  }

  type: CustomDataType;
  boolValue: bool;
  doubleValue: f64;
  stringValue: string;

  constructor(
    type: CustomDataType = 0,
    boolValue: bool = false,
    doubleValue: f64 = 0.0,
    stringValue: string = ""
  ) {
    this.type = type;
    this.boolValue = boolValue;
    this.doubleValue = doubleValue;
    this.stringValue = stringValue;
  }
}

export function encodeCustomDataValue(message: CustomDataValue): Uint8Array {
  return Protobuf.encode(message, CustomDataValue.encode);
}

export function decodeCustomDataValue(buffer: Uint8Array): CustomDataValue {
  return Protobuf.decode<CustomDataValue>(buffer, CustomDataValue.decode);
}
