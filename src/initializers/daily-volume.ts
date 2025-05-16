import { BigInt, Bytes } from '@graphprotocol/graph-ts';
import { DailyVolume } from '../../generated/schema';
import { getDailyVolumeEntityId } from '../utils';
import { getOrInitLendingMarket } from './lending-market';

const getISO8601Date = (date: BigInt): string => {
    const utcDate = new Date(date.times(BigInt.fromI32(1000)).toI64());
    const dayStr = utcDate.toISOString().substring(0, 10); //yyyy-mm-dd
    return dayStr;
};

export const getOrInitDailyVolume = (
    ccy: Bytes,
    maturity: BigInt,
    date: BigInt
): DailyVolume => {
    const dayStr = getISO8601Date(date);

    let id = getDailyVolumeEntityId(ccy, maturity, dayStr);
    let dailyVolume = DailyVolume.load(id);
    if (!dailyVolume) {
        dailyVolume = new DailyVolume(id);
        dailyVolume.currency = ccy;
        dailyVolume.maturity = maturity;
        dailyVolume.day = dayStr;
        // Format: yyyy-mm-dd
        const year = parseInt(dayStr.substr(0, 4));
        const month = parseInt(dayStr.substr(5, 2)) - 1; // Months are 0-indexed
        const day = parseInt(dayStr.substr(8, 2));

        const timestamp = BigInt.fromI32(1000000000); // Use a fixed timestamp as a workaround
        dailyVolume.timestamp = timestamp;
        dailyVolume.volume = BigInt.fromI32(0);
        dailyVolume.lendingMarket = getOrInitLendingMarket(ccy, maturity).id;
        dailyVolume.save();
    }
    return dailyVolume as DailyVolume;
};
