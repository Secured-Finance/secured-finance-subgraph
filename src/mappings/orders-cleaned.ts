import { Address, BigInt, log } from '@graphprotocol/graph-ts';
import { Order } from '../../generated/schema';
import { OrdersCleaned } from '../../generated/templates/OrderActionLogic/OrderActionLogic';

import { getOrInitLendingMarket, initTransaction } from '../initializers';
import { calculateForwardValue, getOrderEntityId } from '../utils';
import { OrderStatus, TransactionType } from '../utils/types';

export function handleOrdersCleaned(event: OrdersCleaned): void {
    for (let i = 0; i < event.params.orderIds.length; i++) {
        const orderId = getOrderEntityId(
            event.params.orderIds[i],
            event.params.ccy,
            event.params.maturity
        );
        const order = Order.load(orderId);

        if (order) {
            const txId =
                event.transaction.hash.toHexString() +
                '-' +
                i.toString() +
                ':' +
                event.logIndex.toString();
            let unitPrice = order.inputUnitPrice;
            const lendingMarket = getOrInitLendingMarket(
                event.params.ccy,
                event.params.maturity
            );
            log.debug('Order ID: {}, isPreOrder: {}, side: {}, unitPrice: {}, lastLendUnitPrice: {}, lastBorrowUnitPrice: {}, openingUnitPrice: {}', [
                orderId,
                order.isPreOrder.toString(),
                order.side.toString(),
                unitPrice.toString(),
                lendingMarket.lastLendUnitPrice.toString(),
                lendingMarket.lastBorrowUnitPrice.toString(),
                lendingMarket.openingUnitPrice.toString()
            ]);
            
            if (
                order.isPreOrder &&
                !lendingMarket.openingUnitPrice.isZero() &&
                ((order.side == 0 &&
                    unitPrice.ge(lendingMarket.lastLendUnitPrice)) ||
                    (order.side == 1 &&
                        unitPrice.le(lendingMarket.lastBorrowUnitPrice)))
            ) {
                log.debug('Condition met for order: {}, setting unitPrice to openingUnitPrice: {}', [
                    orderId,
                    lendingMarket.openingUnitPrice.toString()
                ]);
                unitPrice = lendingMarket.openingUnitPrice;
            }
            initTransaction(
                txId,
                orderId,
                unitPrice,
                Address.fromString(order.user),
                order.currency,
                order.maturity,
                order.side,
                order.inputAmount.minus(order.filledAmount),
                calculateForwardValue(
                    order.inputAmount.minus(order.filledAmount),
                    unitPrice
                ),
                BigInt.fromI32(0),
                TransactionType.Maker,
                event.block.timestamp,
                event.block.number,
                event.transaction.hash
            );
            order.filledAmount = order.inputAmount;
            order.status = OrderStatus.Filled;
            order.statusUpdatedAt = event.block.timestamp;
            order.save();
        }
    }
}
