import { BigInt } from '@graphprotocol/graph-ts';
import { DailyVolume } from '../../../generated/schema';

export function addToTransactionVolume(
    amount: BigInt,
    dailyVolume: DailyVolume
): void {
    dailyVolume.volume = dailyVolume.volume.plus(amount);
    dailyVolume.save();
}
