import { BigInt, ByteArray, Bytes } from '@graphprotocol/graph-ts';

export const EMPTY_BYTES32_PREFIX = ByteArray.fromHexString(
    '0x0000000000000000000000000000000000000000000000000000000000000000'
);

export function toBytes32(text: string): Bytes {
    const bytes = Bytes.fromUTF8(text);
    const emptyBytes = Bytes.fromByteArray(EMPTY_BYTES32_PREFIX).slice(
        0,
        32 - bytes.byteLength
    );
    return bytes.concat(Bytes.fromUint8Array(emptyBytes));
}

export function toBytes20(text: string): Bytes {
    const bytes = Bytes.fromUTF8(text);
    const emptyBytes = Bytes.fromByteArray(EMPTY_BYTES32_PREFIX).slice(
        0,
        20 - bytes.byteLength
    );
    return bytes.concat(Bytes.fromUint8Array(emptyBytes));
}

export function buildLendingMarketId(ccy: Bytes, maturity: BigInt): string {
    return ccy.toHexString() + '-' + maturity.toString();
}
