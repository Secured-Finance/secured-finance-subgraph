import { Address, BigDecimal, BigInt, Bytes } from '@graphprotocol/graph-ts';
import { Order, Transaction } from '../../generated/schema';
import { getOrInitLendingMarket } from './lending-market';
import { getOrInitUser } from './user';

export const initTransaction = (
    txId: string,
    orderId: string,
    filledPrice: BigInt,
    userAddress: Address,
    currency: Bytes,
    maturity: BigInt,
    side: number,
    filledAmount: BigInt,
    filledAmountInFV: BigInt,
    feeInFV: BigInt,
    executionType: string,
    timestamp: BigInt,
    blockNumber: BigInt,
    txHash: Bytes
): void => {
    if (filledAmount.isZero()) return;

    const order = Order.load(orderId);
    if (!order) return;

    const transaction = new Transaction(txId);
    const user = getOrInitUser(userAddress, timestamp);

    transaction.executionPrice = filledPrice;
    transaction.user = user.id;
    transaction.currency = currency;
    transaction.maturity = maturity;
    transaction.side = 0;
    transaction.executionType = executionType;
    transaction.futureValue = filledAmountInFV;
    transaction.amount = filledAmount;
    transaction.feeInFV = feeInFV;
    transaction.averagePrice = !filledAmountInFV.isZero()
        ? filledAmount.divDecimal(new BigDecimal(filledAmountInFV))
        : BigDecimal.zero();
    const lendingMarket = getOrInitLendingMarket(currency, maturity);
    transaction.lendingMarket = lendingMarket.id;
    transaction.createdAt = timestamp;
    transaction.blockNumber = blockNumber;
    transaction.txHash = txHash;
    transaction.order = order.id;
    transaction.save();

    user.transactionCount = user.transactionCount.plus(BigInt.fromI32(1));
    user.save();
};
