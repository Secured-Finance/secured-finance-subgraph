import { Address, BigInt } from '@graphprotocol/graph-ts';
import { Order } from '../../generated/schema';
import { OrdersCleaned } from '../../generated/templates/OrderActionLogic/OrderActionLogic';

import { getOrInitLendingMarket, initTransaction } from '../initializers';
import { calculateForwardValue } from '../utils/helper';
import { getOrderEntityId } from '../utils/helper/id-generation';

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
            if (
                order.isPreOrder &&
                !lendingMarket.openingUnitPrice.isZero() &&
                ((order.side == 0 &&
                    unitPrice >= lendingMarket.lastLendUnitPrice) ||
                    (order.side == 1 &&
                        unitPrice <= lendingMarket.lastBorrowUnitPrice))
            ) {
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
                'Maker',
                event.block.timestamp,
                event.block.number,
                event.transaction.hash
            );
            order.filledAmount = order.inputAmount;
            order.status = 'Filled';
            order.statusUpdatedAt = event.block.timestamp;
            order.save();
        }
    }
}
