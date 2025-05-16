import { Order } from '../../generated/schema';
import { OrderCanceled } from '../../generated/templates/OrderActionLogic/OrderActionLogic';
import { getOrderEntityId } from '../utils';
import { OrderStatus } from '../utils/types';

export function handleOrderCanceled(event: OrderCanceled): void {
    const id = getOrderEntityId(
        event.params.orderId,
        event.params.ccy,
        event.params.maturity
    );
    const order = Order.load(id);
    if (order) {
        order.status = OrderStatus.Cancelled;
        order.statusUpdatedAt = event.block.timestamp;
        order.save();
    }
}
