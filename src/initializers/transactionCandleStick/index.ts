import { BigInt, Bytes } from '@graphprotocol/graph-ts';
import { getOrInitLendingMarket } from '../lendingMarket';
import { getTransactionCandleStickEntityId } from '../../utils/helper';
import { TransactionCandleStick } from '../../../generated/schema';

export const initOrUpdateTransactionCandleStick = (
    currency: Bytes,
    maturity: BigInt,
    amount: BigInt,
    futureValue: BigInt,
    executionPrice: BigInt,
    timestamp: BigInt,
    interval: BigInt
): void => {
    const epochTime = timestamp.div(interval);

    const transactionCandleStickId = getTransactionCandleStickEntityId(
        currency,
        maturity,
        interval,
        epochTime
    );

    let transactionCandleStick = TransactionCandleStick.load(
        transactionCandleStickId
    );

    if (!transactionCandleStick) {
        transactionCandleStick = new TransactionCandleStick(
            transactionCandleStickId
        );
        transactionCandleStick.interval = interval;
        transactionCandleStick.currency = currency;
        transactionCandleStick.maturity = maturity;
        transactionCandleStick.timestamp = epochTime.times(interval);
        transactionCandleStick.open = executionPrice;
        transactionCandleStick.close = executionPrice;
        transactionCandleStick.high = executionPrice;
        transactionCandleStick.low = executionPrice;
        transactionCandleStick.average = executionPrice.toBigDecimal();
        transactionCandleStick.volume = amount;
        transactionCandleStick.volumeInFV = futureValue;
        transactionCandleStick.lendingMarket = getOrInitLendingMarket(
            currency,
            maturity
        ).id;
    } else {
        transactionCandleStick.close = executionPrice;
        if (transactionCandleStick.high.toI32() < executionPrice.toI32()) {
            transactionCandleStick.high = executionPrice;
        }
        if (transactionCandleStick.low.toI32() > executionPrice.toI32()) {
            transactionCandleStick.low = executionPrice;
        }
        transactionCandleStick.average = transactionCandleStick.average
            .times(transactionCandleStick.volume.toBigDecimal())
            .plus(executionPrice.times(amount).toBigDecimal())
            .div(transactionCandleStick.volume.plus(amount).toBigDecimal());
        transactionCandleStick.volume =
            transactionCandleStick.volume.plus(amount);
        transactionCandleStick.volumeInFV =
            transactionCandleStick.volumeInFV.plus(futureValue);
    }

    transactionCandleStick.save();
};
