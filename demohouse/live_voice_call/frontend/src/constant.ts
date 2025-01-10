// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// Licensed under the 【火山方舟】原型应用软件自用许可协议
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at 
//     https://www.volcengine.com/docs/82379/1433703
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License. 

// 用于WebSocket 通信协议的常量值
export const CONST = {
  PROTOCOL_VERSION: 0b0001,
  DEFAULT_HEADER_SIZE: 0b0001,

  // Header size
  PROTOCOL_VERSION_BITS: 4,
  HEADER_BITS: 4,
  MESSAGE_TYPE_BITS: 4,
  MESSAGE_TYPE_SPECIFIC_FLAGS_BITS: 4,
  MESSAGE_SERIALIZATION_BITS: 4,
  MESSAGE_COMPRESSION_BITS: 4,
  RESERVED_BITS: 8,
  // Payload Length
  PAYLOAD_LENGTH_BITES: 32,
  PAYLOAD_LENGTH_BYTES: 4,

  // Message Type:
  CLIENT_FULL_REQUEST: 0b0001,
  CLIENT_AUDIO_ONLY_REQUEST: 0b0010,
  SERVER_FULL_RESPONSE: 0b1001,
  SERVER_AUDIO_ONLY_RESPONSE: 0b1011,
  SERVER_ACK: 0b1011,
  SERVER_ERROR_RESPONSE: 0b1111,

  // Message Type Specific Flags
  NO_SEQUENCE: 0b0000, // no check sequence
  POS_SEQUENCE: 0b0001,
  NEG_WITHOUT_SEQUENCE: 0b0010,
  NEG_WITH_SEQUENCE: 0b0011,

  // Message Serialization
  NO_SERIALIZATION: 0b0000,
  JSON: 0b0001,
  THRIFT: 0b0011,
  CUSTOM_TYPE: 0b1111,

  // Message Compression
  NO_COMPRESSION: 0b0000,
  GZIP: 0b0001,
  CUSTOM_COMPRESSION: 0b1111,
};

export const SAMPLE_RATE = 16000;
export const BIT_RATE = 16;
export const TIME_SLICE = 100; //ms
export const FRAME_SIZE = (SAMPLE_RATE * (BIT_RATE / 8) * TIME_SLICE) / 1000;
