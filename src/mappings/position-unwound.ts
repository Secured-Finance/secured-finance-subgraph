import { BigInt } from '@graphprotocol/graph-ts';
import { PositionUnwound } from '../../generated/templates/OrderActionLogic/OrderActionLogic';
import {
    getOrInitDailyVolume,
    initOrUpdateProtocolVolume,
    initOrUpdateTakerVolume,
    initOrUpdateTransactionCandleStick,
    initOrder,
    initTransaction,
} from '../initializers';
import { INTERVALS, addToTransactionVolume, getOrderEntityId } from '../utils';
import { OrderStatus, OrderType, TransactionType } from '../utils/types';

export function handlePositionUnwound(event: PositionUnwound): void {
    const orderId =
        getOrderEntityId(
            BigInt.fromI32(0),
            event.params.ccy,
            event.params.maturity
        ) +
        ':' +
        event.transaction.hash.toHexString();
    let status: string;
    if (event.params.filledAmountInFV.equals(event.params.inputFutureValue)) {
        status = OrderStatus.Filled;
    } else {
        status = OrderStatus.Killed;
    }

    initOrder(
        orderId,
        BigInt.fromI32(0),
        event.params.user,
        event.params.ccy,
        event.params.side,
        event.params.maturity,
        BigInt.fromI32(0),
        event.params.inputFutureValue,
        event.params.filledAmountInFV,
        status,
        false,
        OrderType.Unwind,
        event.params.isCircuitBreakerTriggered,
        event.block.timestamp,
        event.block.number,
        event.transaction.hash
    );
    if (!event.params.filledAmount.isZero()) {
        const txId =
            event.transaction.hash.toHexString() +
            ':' +
            event.logIndex.toString();
        initTransaction(
            txId,
            orderId,
            event.params.filledUnitPrice,
            event.params.user,
            event.params.ccy,
            event.params.maturity,
            event.params.side,
            event.params.filledAmount,
            event.params.filledAmountInFV,
            event.params.feeInFV,
            TransactionType.Taker,
            event.block.timestamp,
            event.block.number,
            event.transaction.hash
        );
        const dailyVolume = getOrInitDailyVolume(
            event.params.ccy,
            event.params.maturity,
            event.block.timestamp
        );

        addToTransactionVolume(event.params.filledAmount, dailyVolume);

        // Update protocol and taker trading volumes
        initOrUpdateProtocolVolume(event.params.filledAmount, event.params.ccy);
        initOrUpdateTakerVolume(
            event.params.filledAmount,
            event.params.ccy,
            event.params.user,
            event.block.timestamp
        );

        for (let i = 0; i < INTERVALS.length; i++) {
            initOrUpdateTransactionCandleStick(
                event.params.ccy,
                event.params.maturity,
                event.params.filledAmount,
                event.params.filledAmountInFV,
                event.params.filledUnitPrice,
                event.block.timestamp,
                BigInt.fromI32(INTERVALS[i])
            );
        }
    }
}
