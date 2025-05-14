import { BigInt } from '@graphprotocol/graph-ts';
import { OrderExecuted } from '../../../../generated/templates/OrderActionLogic/OrderActionLogic';
import {
    getOrInitDailyVolume,
    initOrder,
    initOrUpdateProtocolVolume,
    initOrUpdateTakerVolume,
    initOrUpdateTransactionCandleStick,
    initTransaction,
} from '../../../initializers';
import { intervals } from '../../../utils/constant';
import { getOrderEntityId } from '../../../utils/helper/id-generation';
import { addToTransactionVolume } from '../../../utils/helper';

export function handleOrderExecuted(event: OrderExecuted): void {
    let orderId = getOrderEntityId(
        event.params.placedOrderId,
        event.params.ccy,
        event.params.maturity
    );
    let status: string;
    let type: string;
    if (event.params.inputUnitPrice.isZero()) {
        type = 'Market';
    } else {
        type = 'Limit';
    }

    if (event.params.filledAmount.equals(event.params.inputAmount)) {
        status = 'Filled';
    } else if (
        event.params.inputAmount.equals(
            event.params.filledAmount.plus(event.params.placedAmount)
        )
    ) {
        if (event.params.filledAmount.isZero()) {
            status = 'Open';
        } else {
            status = 'PartiallyFilled';
        }
    } else {
        // set status to Killed for circuit breaker and partially filled Market orders
        status = 'Killed';
    }

    if (event.params.placedOrderId.isZero()) {
        orderId = orderId + ':' + event.transaction.hash.toHexString();
    }

    initOrder(
        orderId,
        event.params.placedOrderId,
        event.params.user,
        event.params.ccy,
        event.params.side,
        event.params.maturity,
        event.params.inputUnitPrice,
        event.params.inputAmount,
        event.params.filledAmount,
        status,
        false,
        type,
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
            'Taker',
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

        for (let i = 0; i < intervals.length; i++) {
            initOrUpdateTransactionCandleStick(
                event.params.ccy,
                event.params.maturity,
                event.params.filledAmount,
                event.params.filledAmountInFV,
                event.params.filledUnitPrice,
                event.block.timestamp,
                BigInt.fromI32(intervals[i])
            );
        }
    }
}
