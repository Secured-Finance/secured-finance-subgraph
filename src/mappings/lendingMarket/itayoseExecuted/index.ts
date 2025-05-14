import { BigInt } from '@graphprotocol/graph-ts';
import { ItayoseExecuted } from '../../../../generated/templates/OrderBookLogic/OrderBookLogic';
import {
    getOrInitDailyVolume,
    getOrInitLendingMarket,
    initOrUpdateProtocolVolume,
    initOrUpdateTransactionCandleStick,
} from '../../../initializers';
import { intervals } from '../../../utils/constant';
import {
    addToTransactionVolume,
    calculateForwardValue,
} from '../../../utils/helper';

export function handleItayoseExecuted(event: ItayoseExecuted): void {
    const lendingMarket = getOrInitLendingMarket(
        event.params.ccy,
        event.params.maturity
    );
    lendingMarket.openingUnitPrice = event.params.openingUnitPrice;
    lendingMarket.lastLendUnitPrice = event.params.lastLendUnitPrice;
    lendingMarket.lastBorrowUnitPrice = event.params.lastBorrowUnitPrice;
    lendingMarket.offsetAmount = event.params.offsetAmount;
    lendingMarket.save();

    const dailyVolume = getOrInitDailyVolume(
        event.params.ccy,
        event.params.maturity,
        event.block.timestamp
    );
    addToTransactionVolume(event.params.offsetAmount, dailyVolume);

    // Update protocol trading volume (no user volume for itayose)
    initOrUpdateProtocolVolume(event.params.offsetAmount, event.params.ccy);

    const offsetAmountInFV = calculateForwardValue(
        event.params.offsetAmount,
        event.params.openingUnitPrice
    );
    for (let i = 0; i < intervals.length; i++) {
        initOrUpdateTransactionCandleStick(
            event.params.ccy,
            event.params.maturity,
            event.params.offsetAmount,
            offsetAmountInFV,
            event.params.openingUnitPrice,
            event.block.timestamp,
            BigInt.fromI32(intervals[i])
        );
    }
}
