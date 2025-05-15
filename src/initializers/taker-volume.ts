import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';
import { TakerVolumeByCurrency, User } from '../../generated/schema';
import { INTERVALS } from '../utils/constant';
import { getOrInitTakerVolumeByIntervalAndCurrency } from './taker-volume-by-interval-and-currency';

export const initOrUpdateTakerVolume = (
    amount: BigInt,
    currency: Bytes,
    userAddress: Address,
    blockTimestamp: BigInt
): TakerVolumeByCurrency => {
    const userId = userAddress.toHexString();
    const id = userId + '-' + currency.toHexString();

    let takerVolume = TakerVolumeByCurrency.load(id);
    if (!takerVolume) {
        let user = User.load(userAddress.toHexString());
        if (!user) {
            user = new User(userAddress.toHexString());
            user.transactionCount = BigInt.fromI32(0);
            user.orderCount = BigInt.fromI32(0);
            user.liquidationCount = BigInt.fromI32(0);
            user.transferCount = BigInt.fromI32(0);
            user.createdAt = blockTimestamp;
            user.save();
        }
        takerVolume = new TakerVolumeByCurrency(id);
        takerVolume.user = user.id;
        takerVolume.currency = currency;
        takerVolume.totalVolume = amount;
    } else {
        takerVolume.totalVolume = takerVolume.totalVolume.plus(amount);
    }
    takerVolume.save();

    for (let i = 0; i < INTERVALS.length; i++) {
        const interval = INTERVALS[i];
        // Calculate the start of the interval
        const createdAt = blockTimestamp.minus(
            blockTimestamp.mod(BigInt.fromI32(interval))
        );
        // Update or initialize the interval transaction volume
        const volume = getOrInitTakerVolumeByIntervalAndCurrency(
            takerVolume.id,
            currency,
            BigInt.fromI32(INTERVALS[i]),
            createdAt,
            blockTimestamp
        );
        volume.volume = volume.volume.plus(amount);
        volume.updatedAt = blockTimestamp;
        volume.save();
    }
    return takerVolume as TakerVolumeByCurrency;
};
