import { OrderBooksRotated } from '../../../../../generated/LendingMarketOperationLogic/LendingMarketController';
import { getOrInitLendingMarket } from '../../../../initializers';

// Load all transactions for the rolling market, and change their maturity to the closest one
export function handleOrderBooksRotated(event: OrderBooksRotated): void {
    // Create the new market if it doesn't exist
    getOrInitLendingMarket(event.params.ccy, event.params.newMaturity);

    const rollingOutMarket = getOrInitLendingMarket(
        event.params.ccy,
        event.params.oldMaturity
    );

    rollingOutMarket.isActive = false;
    rollingOutMarket.save();
}
