import { Address, BigInt, Bytes, log } from '@graphprotocol/graph-ts';
import { Order } from '../../generated/schema';
import { getOrInitLendingMarket } from './lending-market';
import { getOrInitUser } from './user';

export const initOrder = (
    id: string,
    orderId: BigInt,
    userAddress: Address,
    currency: Bytes,
    side: i32,
    maturity: BigInt,
    inputUnitPrice: BigInt,
    inputAmount: BigInt,
    filledAmount: BigInt,
    status: string,
    isPreOrder: boolean,
    type: string,
    isCircuitBreakerTriggered: boolean,
    timestamp: BigInt,
    blockNumber: BigInt,
    txHash: Bytes
): void => {
    const order = new Order(id);
    const user = getOrInitUser(userAddress, timestamp);

    order.orderId = orderId;
    order.user = user.id;
    order.currency = currency;
    order.side = side;
    order.maturity = maturity;
    order.inputUnitPrice = inputUnitPrice;
    order.filledAmount = filledAmount;
    order.inputAmount = inputAmount;
    order.status = status;
    order.statusUpdatedAt = timestamp;
    order.lendingMarket = getOrInitLendingMarket(currency, maturity).id;
    order.isPreOrder = isPreOrder;
    order.type = type;
    order.isCircuitBreakerTriggered = isCircuitBreakerTriggered;
    order.createdAt = timestamp;
    order.blockNumber = blockNumber;
    order.txHash = txHash;
    order.save();

    user.orderCount = user.orderCount.plus(BigInt.fromI32(1));
    user.save();

    log.debug('Order created with: {}', [id]);
};
