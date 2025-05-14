import { LendingMarketInitialized } from '../../../../generated/LendingMarketOperationLogic/LendingMarketController';
import {
    OrderActionLogic,
    OrderBookLogic,
} from '../../../../generated/templates';

export function handleLendingMarketInitialized(
    event: LendingMarketInitialized
): void {
    OrderActionLogic.create(event.params.lendingMarket);
    OrderBookLogic.create(event.params.lendingMarket);
}
