import { OrderBookCreated } from '../../../../../generated/LendingMarketOperationLogic/LendingMarketController';
import { getOrInitLendingMarket } from '../../../../initializers';

export function handleOrderBookCreated(event: OrderBookCreated): void {
    getOrInitLendingMarket(event.params.ccy, event.params.maturity);
}
