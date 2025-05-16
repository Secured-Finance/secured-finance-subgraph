import { BigInt, Bytes, log } from '@graphprotocol/graph-ts';
import { LendingMarket } from '../../generated/schema';
import { buildLendingMarketId } from '../utils';

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
