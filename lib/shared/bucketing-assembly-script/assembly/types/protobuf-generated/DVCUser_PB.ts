// Code generated by protoc-gen-as. DO NOT EDIT.
// Versions:
//   protoc-gen-as v1.3.0
//   protoc        v3.21.12

import { Writer, Reader, Protobuf } from "as-proto/assembly";
import { NullableString } from "./NullableString";
import { NullableDouble } from "./NullableDouble";
import { NullableCustomData } from "./NullableCustomData";

export class DVCUser_PB {
  static encode(message: DVCUser_PB, writer: Writer): void {
    writer.uint32(10);
    writer.string(message.userId);

    const email = message.email;
    if (email !== null) {
      writer.uint32(18);
      writer.fork();
      NullableString.encode(email, writer);
      writer.ldelim();
    }

    const name = message.name;
    if (name !== null) {
      writer.uint32(26);
      writer.fork();
      NullableString.encode(name, writer);
      writer.ldelim();
    }

    const language = message.language;
    if (language !== null) {
      writer.uint32(34);
      writer.fork();
      NullableString.encode(language, writer);
      writer.ldelim();
    }

    const country = message.country;
    if (country !== null) {
      writer.uint32(42);
      writer.fork();
      NullableString.encode(country, writer);
      writer.ldelim();
    }

    const appBuild = message.appBuild;
    if (appBuild !== null) {
      writer.uint32(50);
      writer.fork();
      NullableDouble.encode(appBuild, writer);
      writer.ldelim();
    }

    const appVersion = message.appVersion;
    if (appVersion !== null) {
      writer.uint32(58);
      writer.fork();
      NullableString.encode(appVersion, writer);
      writer.ldelim();
    }

    const deviceModel = message.deviceModel;
    if (deviceModel !== null) {
      writer.uint32(66);
      writer.fork();
      NullableString.encode(deviceModel, writer);
      writer.ldelim();
    }

    const customData = message.customData;
    if (customData !== null) {
      writer.uint32(74);
      writer.fork();
      NullableCustomData.encode(customData, writer);
      writer.ldelim();
    }

    const privateCustomData = message.privateCustomData;
    if (privateCustomData !== null) {
      writer.uint32(82);
      writer.fork();
      NullableCustomData.encode(privateCustomData, writer);
      writer.ldelim();
    }
  }

  static decode(reader: Reader, length: i32): DVCUser_PB {
    const end: usize = length < 0 ? reader.end : reader.ptr + length;
    const message = new DVCUser_PB();

    while (reader.ptr < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.userId = reader.string();
          break;

        case 2:
          message.email = NullableString.decode(reader, reader.uint32());
          break;

        case 3:
          message.name = NullableString.decode(reader, reader.uint32());
          break;

        case 4:
          message.language = NullableString.decode(reader, reader.uint32());
          break;

        case 5:
          message.country = NullableString.decode(reader, reader.uint32());
          break;

        case 6:
          message.appBuild = NullableDouble.decode(reader, reader.uint32());
          break;

        case 7:
          message.appVersion = NullableString.decode(reader, reader.uint32());
          break;

        case 8:
          message.deviceModel = NullableString.decode(reader, reader.uint32());
          break;

        case 9:
          message.customData = NullableCustomData.decode(
            reader,
            reader.uint32()
          );
          break;

        case 10:
          message.privateCustomData = NullableCustomData.decode(
            reader,
            reader.uint32()
          );
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  }

  userId: string;
  email: NullableString | null;
  name: NullableString | null;
  language: NullableString | null;
  country: NullableString | null;
  appBuild: NullableDouble | null;
  appVersion: NullableString | null;
  deviceModel: NullableString | null;
  customData: NullableCustomData | null;
  privateCustomData: NullableCustomData | null;

  constructor(
    userId: string = "",
    email: NullableString | null = null,
    name: NullableString | null = null,
    language: NullableString | null = null,
    country: NullableString | null = null,
    appBuild: NullableDouble | null = null,
    appVersion: NullableString | null = null,
    deviceModel: NullableString | null = null,
    customData: NullableCustomData | null = null,
    privateCustomData: NullableCustomData | null = null
  ) {
    this.userId = userId;
    this.email = email;
    this.name = name;
    this.language = language;
    this.country = country;
    this.appBuild = appBuild;
    this.appVersion = appVersion;
    this.deviceModel = deviceModel;
    this.customData = customData;
    this.privateCustomData = privateCustomData;
  }
}

export function encodeDVCUser_PB(message: DVCUser_PB): Uint8Array {
  return Protobuf.encode(message, DVCUser_PB.encode);
}

export function decodeDVCUser_PB(buffer: Uint8Array): DVCUser_PB {
  return Protobuf.decode<DVCUser_PB>(buffer, DVCUser_PB.decode);
}
