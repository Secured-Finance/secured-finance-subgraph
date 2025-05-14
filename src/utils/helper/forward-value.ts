import { BigInt } from '@graphprotocol/graph-ts';

export function calculateForwardValue(
    amount: BigInt,
    unitPrice: BigInt
): BigInt {
    return amount.times(BigInt.fromI32(10000)).div(unitPrice);
}
