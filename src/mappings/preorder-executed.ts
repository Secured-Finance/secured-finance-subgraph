import { BigInt } from '@graphprotocol/graph-ts';
import { PreOrderExecuted } from '../../generated/templates/OrderActionLogic/OrderActionLogic';
import { initOrder } from '../initializers';
import { getOrderEntityId } from '../utils/helper/id-generation';

export function handlePreOrderExecuted(event: PreOrderExecuted): void {
    const id = getOrderEntityId(
        event.params.orderId,
        event.params.ccy,
        event.params.maturity
    );
    initOrder(
        id,
        event.params.orderId,
        event.params.user,
        event.params.ccy,
        event.params.side,
        event.params.maturity,
        event.params.unitPrice,
        event.params.amount,
        BigInt.fromI32(0),
        'Open',
        true,
        'Limit',
        false,
        event.block.timestamp,
        event.block.number,
        event.transaction.hash
    );
}
