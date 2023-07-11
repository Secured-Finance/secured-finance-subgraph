import {
    Address,
    BigDecimal,
    BigInt,
    Bytes,
    log,
} from '@graphprotocol/graph-ts';
import {
    DailyVolume,
    LendingMarket,
    Protocol,
    User,
    Order,
    Transaction,
} from '../../generated/schema';
import { getDailyVolumeEntityId } from '../utils/id-generation';
import { buildLendingMarketId } from '../utils/string';

export const PROTOCOL_ID = 'ethereum';

export const getProtocol = (): Protocol => {
    let protocol = Protocol.load(PROTOCOL_ID);
    if (!protocol) {
        protocol = new Protocol(PROTOCOL_ID);
        protocol.totalUsers = BigInt.fromI32(0);
        protocol.save();
    }
    return protocol as Protocol;
};

export const getOrInitLendingMarket = (
    ccy: Bytes,
    maturity: BigInt
): LendingMarket => {
    const id = buildLendingMarketId(ccy, maturity);
    let lendingMarket = LendingMarket.load(id);
    if (!lendingMarket) {
        lendingMarket = new LendingMarket(id);
        lendingMarket.currency = ccy;
        lendingMarket.maturity = maturity;
        lendingMarket.prettyName = ccy.toString() + '-' + maturity.toString();
        lendingMarket.isActive = true;
        lendingMarket.protocol = getProtocol().id;
        lendingMarket.volume = BigInt.fromI32(0);
        lendingMarket.openingUnitPrice = BigInt.fromI32(0);
        lendingMarket.lastLendUnitPrice = BigInt.fromI32(0);
        lendingMarket.lastBorrowUnitPrice = BigInt.fromI32(0);
        lendingMarket.offsetAmount = BigInt.fromI32(0);

        lendingMarket.save();
        log.debug('Created lending market: {}', [lendingMarket.prettyName]);
    }
    return lendingMarket as LendingMarket;
};

export const getOrInitUser = (address: Bytes): User => {
    let user = User.load(address.toHexString());
    if (!user) {
        user = new User(address.toHexString());
        user.transactionCount = BigInt.fromI32(0);
        user.orderCount = BigInt.fromI32(0);
        user.save();

        log.debug('New user: {}', [user.id]);

        // Add user to protocol
        const protocol = getProtocol();
        protocol.totalUsers = protocol.totalUsers.plus(BigInt.fromI32(1));
        protocol.save();
    }
    return user as User;
};

export const getOrInitDailyVolume = (
    ccy: Bytes,
    maturity: BigInt,
    date: BigInt
): DailyVolume => {
    const utcDate = new Date(date.times(BigInt.fromI32(1000)).toI64());
    const dayStr = utcDate.toISOString().substring(0, 10); //yyyy-mm-dd

    let id = getDailyVolumeEntityId(ccy, maturity, dayStr);
    let dailyVolume = DailyVolume.load(id);
    if (!dailyVolume) {
        dailyVolume = new DailyVolume(id);
        dailyVolume.currency = ccy;
        dailyVolume.maturity = maturity;
        dailyVolume.day = dayStr;
        dailyVolume.timestamp = BigInt.fromI64(
            Date.parse(dayStr).getTime() / 1000
        );
        dailyVolume.volume = BigInt.fromI32(0);
        dailyVolume.lendingMarket = getOrInitLendingMarket(ccy, maturity).id;
        dailyVolume.save();
    }
    return dailyVolume as DailyVolume;
};

export const initOrder = (
    id: string,
    orderId: BigInt,
    maker: Address,
    currency: Bytes,
    side: i32,
    maturity: BigInt,
    unitPrice: BigInt,
    filledAmount: BigInt,
    amount: BigInt,
    status: string,
    isPreOrder: boolean,
    createdAt: BigInt,
    blockNumber: BigInt,
    txHash: Bytes
): void => {
    if (amount.isZero()) return;

    const order = new Order(id);
    const user = getOrInitUser(maker);

    order.orderId = orderId;
    order.maker = user.id;
    order.currency = currency;
    order.side = side;
    order.maturity = maturity;
    order.unitPrice = unitPrice;
    order.filledAmount = filledAmount;
    order.amount = amount;
    order.status = status;
    order.lendingMarket = getOrInitLendingMarket(currency, maturity).id;
    order.isPreOrder = isPreOrder;
    order.createdAt = createdAt;
    order.blockNumber = blockNumber;
    order.txHash = txHash;
    order.save();

    user.orderCount = user.orderCount.plus(BigInt.fromI32(1));
    user.save();
};

export const initTransaction = (
    txId: string,
    unitPrice: BigInt,
    taker: Address,
    currency: Bytes,
    maturity: BigInt,
    side: i32,
    filledAmount: BigInt,
    filledFutureValue: BigInt,
    executionType: string,
    timestamp: BigInt,
    blockNumber: BigInt,
    txHash: Bytes
): void => {
    if (filledAmount.isZero()) return;

    const transaction = new Transaction(txId);
    const user = getOrInitUser(taker);

    transaction.orderPrice = unitPrice;
    transaction.taker = user.id;
    transaction.currency = currency;
    transaction.maturity = maturity;
    transaction.side = side;
    transaction.executionType = executionType;
    transaction.forwardValue = filledFutureValue;
    transaction.amount = filledAmount;
    transaction.averagePrice = !filledFutureValue.isZero()
        ? filledAmount.divDecimal(new BigDecimal(filledFutureValue))
        : BigDecimal.zero();
    transaction.lendingMarket = getOrInitLendingMarket(currency, maturity).id;
    transaction.createdAt = timestamp;
    transaction.blockNumber = blockNumber;
    transaction.txHash = txHash;
    transaction.save();

    user.transactionCount = user.transactionCount.plus(BigInt.fromI32(1));
    user.save();
};
