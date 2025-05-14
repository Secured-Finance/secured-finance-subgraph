import { Order } from '../../generated/schema';
import { OrderCanceled } from '../../generated/templates/OrderActionLogic/OrderActionLogic';
import { getOrderEntityId } from '../utils/helper';

export function handleOrderCanceled(event: OrderCanceled): void {
    const id = getOrderEntityId(
        event.params.orderId,
        event.params.ccy,
        event.params.maturity
    );
    const order = Order.load(id);
    if (order) {
        order.status = 'Cancelled';
        order.statusUpdatedAt = event.block.timestamp;
        order.save();
    }
}
