import {
    Address,
    BigDecimal,
    BigInt,
    Bytes,
    log,
} from '@graphprotocol/graph-ts';
import {
    DailyVolume,
    Deposit,
    LendingMarket,
    Liquidation,
    Order,
    Protocol,
    ProtocolVolumeByCurrency,
    TakerVolumeByCurrency,
    Transaction,
    TransactionCandleStick,
    Transfer,
    User,
} from '../../generated/schema';
import {
    getDailyVolumeEntityId,
    getTransactionCandleStickEntityId,
} from '../utils/id-generation';
import { buildLendingMarketId } from '../utils/string';

const PROTOCOL_ID = '1';

export const getProtocol = (): Protocol => {
    let protocol = Protocol.load(PROTOCOL_ID);
    if (!protocol) {
        protocol = new Protocol(PROTOCOL_ID);
        protocol.totalUsers = BigInt.fromI32(0);
        protocol.save();
    }
    return protocol as Protocol;
};

export const updateOrInitProtocolVolume = (
    amount: BigInt,
    currency: Bytes
): ProtocolVolumeByCurrency => {
    const protocol = getProtocol();
    let protocolVolume = ProtocolVolumeByCurrency.load(currency.toHexString());
    if (!protocolVolume) {
        protocolVolume = new ProtocolVolumeByCurrency(currency.toHexString());
        protocolVolume.protocol = protocol.id;
        protocolVolume.currency = currency;
        protocolVolume.totalVolume = amount;
    } else {
        protocolVolume.totalVolume = protocolVolume.totalVolume.plus(amount);
    }
    protocolVolume.save();
    return protocolVolume as ProtocolVolumeByCurrency;
};

export const updateOrInitTakerVolume = (
    amount: BigInt,
    currency: Bytes,
    userAddress: Address
): TakerVolumeByCurrency => {
    const userId = userAddress.toHexString();
    const id = userId + '-' + currency.toHexString();
    
    let takerVolume = TakerVolumeByCurrency.load(id);
    if (!takerVolume) {
        const user = getOrInitUser(userAddress, BigInt.fromI32(0));
        takerVolume = new TakerVolumeByCurrency(id);
        takerVolume.user = user.id;
        takerVolume.currency = currency;
        takerVolume.totalVolume = amount;
    } else {
        takerVolume.totalVolume = takerVolume.totalVolume.plus(amount);
    }
    takerVolume.save();
    return takerVolume as TakerVolumeByCurrency;
};

const getISO8601Date = (date: BigInt): string => {
    const utcDate = new Date(date.times(BigInt.fromI32(1000)).toI64());
    const dayStr = utcDate.toISOString().substring(0, 10); //yyyy-mm-dd
    return dayStr;
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
        lendingMarket.isActive = true;
        lendingMarket.volume = BigInt.fromI32(0);
        lendingMarket.openingUnitPrice = BigInt.fromI32(0);
        lendingMarket.lastLendUnitPrice = BigInt.fromI32(0);
        lendingMarket.lastBorrowUnitPrice = BigInt.fromI32(0);
        lendingMarket.offsetAmount = BigInt.fromI32(0);

        lendingMarket.save();
        log.debug('Created lending market: {} {}', [
            lendingMarket.currency.toString(),
            lendingMarket.maturity.toString(),
        ]);
    }
    return lendingMarket as LendingMarket;
};

export const getOrInitUser = (address: Bytes, createdAt: BigInt): User => {
    let user = User.load(address.toHexString());
    if (!user) {
        user = new User(address.toHexString());
        user.transactionCount = BigInt.fromI32(0);
        user.orderCount = BigInt.fromI32(0);
        user.liquidationCount = BigInt.fromI32(0);
        user.transferCount = BigInt.fromI32(0);
        user.createdAt = createdAt;
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
    const dayStr = getISO8601Date(date);

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

export const initTransaction = (
    txId: string,
    orderId: string,
    filledPrice: BigInt,
    userAddress: Address,
    currency: Bytes,
    maturity: BigInt,
    side: i32,
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
    transaction.side = side;
    transaction.executionType = executionType;
    transaction.futureValue = filledAmountInFV;
    transaction.amount = filledAmount;
    transaction.feeInFV = feeInFV;
    transaction.averagePrice = !filledAmountInFV.isZero()
        ? filledAmount.divDecimal(new BigDecimal(filledAmountInFV))
        : BigDecimal.zero();
    transaction.lendingMarket = getOrInitLendingMarket(currency, maturity).id;
    transaction.createdAt = timestamp;
    transaction.blockNumber = blockNumber;
    transaction.txHash = txHash;
    transaction.order = order.id;
    transaction.save();

    user.transactionCount = user.transactionCount.plus(BigInt.fromI32(1));
    user.save();
};

export const initLiquidation = (
    id: string,
    userAddress: Address,
    collateralCurrency: Bytes,
    debtCurrency: Bytes,
    debtMaturity: BigInt,
    debtAmount: BigInt,
    timestamp: BigInt,
    blockNumber: BigInt,
    txHash: Bytes
): void => {
    const liquidation = new Liquidation(id);

    const user = getOrInitUser(userAddress, timestamp);

    liquidation.user = user.id;
    liquidation.collateralCurrency = collateralCurrency;
    liquidation.debtCurrency = debtCurrency;
    liquidation.debtMaturity = debtMaturity;
    liquidation.debtAmount = debtAmount;
    liquidation.timestamp = timestamp;
    liquidation.blockNumber = blockNumber;
    liquidation.txHash = txHash;
    liquidation.save();

    user.liquidationCount = user.liquidationCount.plus(BigInt.fromI32(1));
    user.save();
};

export const initTransfer = (
    id: string,
    userAddress: Address,
    currency: Bytes,
    amount: BigInt,
    transferType: string,
    timestamp: BigInt,
    blockNumber: BigInt,
    txHash: Bytes
): void => {
    const transfer = new Transfer(id);

    const user = getOrInitUser(userAddress, timestamp);

    transfer.user = user.id;
    transfer.currency = currency;
    transfer.amount = amount;
    transfer.transferType = transferType;
    transfer.timestamp = timestamp;
    transfer.blockNumber = blockNumber;
    transfer.txHash = txHash;
    transfer.save();

    if (transferType === 'Deposit') {
        const currencyString = currency.toString();
        const depositID = user.id + ':' + currencyString;
        let deposit = Deposit.load(depositID);
        if (!deposit) {
            deposit = new Deposit(depositID);
            deposit.user = user.id;
            deposit.currency = currency;
            deposit.amount = amount;
        } else {
            deposit.amount = deposit.amount.plus(amount);
        }
        deposit.save();
    }

    user.transferCount = user.transferCount.plus(BigInt.fromI32(1));
    user.save();
};

export const initOrUpdateTransactionCandleStick = (
    currency: Bytes,
    maturity: BigInt,
    amount: BigInt,
    futureValue: BigInt,
    executionPrice: BigInt,
    timestamp: BigInt,
    interval: BigInt
): void => {
    const epochTime = timestamp.div(interval);

    const transactionCandleStickId = getTransactionCandleStickEntityId(
        currency,
        maturity,
        interval,
        epochTime
    );

    let transactionCandleStick = TransactionCandleStick.load(
        transactionCandleStickId
    );

    if (!transactionCandleStick) {
        transactionCandleStick = new TransactionCandleStick(
            transactionCandleStickId
        );
        transactionCandleStick.interval = interval;
        transactionCandleStick.currency = currency;
        transactionCandleStick.maturity = maturity;
        transactionCandleStick.timestamp = epochTime.times(interval);
        transactionCandleStick.open = executionPrice;
        transactionCandleStick.close = executionPrice;
        transactionCandleStick.high = executionPrice;
        transactionCandleStick.low = executionPrice;
        transactionCandleStick.average = executionPrice.toBigDecimal();
        transactionCandleStick.volume = amount;
        transactionCandleStick.volumeInFV = futureValue;
        transactionCandleStick.lendingMarket = getOrInitLendingMarket(
            currency,
            maturity
        ).id;
    } else {
        transactionCandleStick.close = executionPrice;
        transactionCandleStick.high = BigInt.fromI32(
            Math.max(
                transactionCandleStick.high.toI32(),
                executionPrice.toI32()
            )
        );
        transactionCandleStick.low = BigInt.fromI32(
            Math.min(
                transactionCandleStick.low.toI32(),
                executionPrice.toI32()
            )
        );
        transactionCandleStick.average = transactionCandleStick.average
            .times(transactionCandleStick.volume.toBigDecimal())
            .plus(executionPrice.times(amount).toBigDecimal())
            .div(transactionCandleStick.volume.plus(amount).toBigDecimal());
        transactionCandleStick.volume =
            transactionCandleStick.volume.plus(amount);
        transactionCandleStick.volumeInFV =
            transactionCandleStick.volumeInFV.plus(futureValue);
    }

    transactionCandleStick.save();
};
