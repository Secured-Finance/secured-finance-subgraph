import { LiquidationExecuted } from '../../../generated/LiquidationLogic/LendingMarketController';
import { initLiquidation } from '../../initializers';

export function handleLiquidationExecuted(event: LiquidationExecuted): void {
    const id =
        event.transaction.hash.toHexString() + ':' + event.logIndex.toString();

    initLiquidation(
        id,
        event.params.user,
        event.params.collateralCcy,
        event.params.debtCcy,
        event.params.debtMaturity,
        event.params.debtAmount,
        event.block.timestamp,
        event.block.number,
        event.transaction.hash
    );
}
