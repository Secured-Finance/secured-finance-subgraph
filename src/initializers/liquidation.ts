import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';
import { Liquidation } from '../../generated/schema';
import { getOrInitUser } from './user';

export const initLiquidation = (
    id: string,
    userAddress: Address,
    collateralCurrency: Bytes,
    debtCurrency: Bytes,
    debtMaturity: BigInt,
    debtAmount: BigInt,
    timestamp: BigInt,
    blockNumber: BigInt,
    txHash: Bytes
): void => {
    const liquidation = new Liquidation(id);

    const user = getOrInitUser(userAddress, timestamp);

    liquidation.user = user.id;
    liquidation.collateralCurrency = collateralCurrency;
    liquidation.debtCurrency = debtCurrency;
    liquidation.debtMaturity = debtMaturity;
    liquidation.debtAmount = debtAmount;
    liquidation.timestamp = timestamp;
    liquidation.blockNumber = blockNumber;
    liquidation.txHash = txHash;
    liquidation.save();

    user.liquidationCount = user.liquidationCount.plus(BigInt.fromI32(1));
    user.save();
};
