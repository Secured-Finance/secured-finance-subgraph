import { Bytes, BigInt } from '@graphprotocol/graph-ts';
import { getOrInitLendingMarket } from '../lendingMarket';
import { getDailyVolumeEntityId } from '../../utils/helper';
import { DailyVolume } from '../../../generated/schema';

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
        dailyVolume.timestamp = BigInt.fromI64(
            Date.parse(dayStr).getTime() / 1000
        );
        dailyVolume.volume = BigInt.fromI32(0);
        dailyVolume.lendingMarket = getOrInitLendingMarket(ccy, maturity).id;
        dailyVolume.save();
    }
    return dailyVolume as DailyVolume;
};
