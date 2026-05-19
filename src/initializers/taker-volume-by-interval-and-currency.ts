import { BigInt, Bytes } from '@graphprotocol/graph-ts';
import { TakerVolumeByIntervalAndCurrency } from '../../generated/schema';

export const getOrInitTakerVolumeByIntervalAndCurrency = (
    takerVolumeId: string,
    currency: Bytes,
    interval: BigInt,
    createdAt: BigInt,
    updatedAt: BigInt
): TakerVolumeByIntervalAndCurrency => {
    const id =
        takerVolumeId + '-' + interval.toString() + '-' + createdAt.toString();
    let volume = TakerVolumeByIntervalAndCurrency.load(id);
    if (!volume) {
        volume = new TakerVolumeByIntervalAndCurrency(id);
        volume.takerVolumesByCurrency = takerVolumeId;
        volume.currency = currency;
        volume.interval = interval;
        volume.createdAt = createdAt;
        volume.volume = BigInt.fromI32(0);
        volume.updatedAt = updatedAt;
        volume.save();
    }
    return volume as TakerVolumeByIntervalAndCurrency;
};
