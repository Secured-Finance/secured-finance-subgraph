import { BigInt } from '@graphprotocol/graph-ts';
import { assert, describe, test } from 'matchstick-as/assembly/index';
import { getOrInitUser } from '../src/initializers';
import { handleLiquidationExecuted } from '../src/mappings';
import { toBytes32 } from '../src/utils/helper/string';
import { createLiquidationExecutedEvent } from './mocks';
import { ALICE } from './utils/createEntities';

const filBytes = toBytes32('FIL');
const ethBytes = toBytes32('ETH');

const debtMaturity = BigInt.fromI32(1669852800);
const debtAmount = BigInt.fromI32(1006378212);

describe('Liquidation Executed', () => {
    test('should create liquidation when liquidation event is executed', () => {
        const event = createLiquidationExecutedEvent(
            ALICE,
            ethBytes,
            filBytes,
            debtMaturity,
            debtAmount
        );
        handleLiquidationExecuted(event);

        const id =
            event.transaction.hash.toHexString() +
            ':' +
            event.logIndex.toString();

        assert.fieldEquals(
            'Liquidation',
            id,
            'collateralCurrency',
            ethBytes.toHexString()
        );
        assert.fieldEquals(
            'Liquidation',
            id,
            'debtCurrency',
            filBytes.toHexString()
        );
        assert.fieldEquals(
            'Liquidation',
            id,
            'debtMaturity',
            debtMaturity.toString()
        );
        assert.fieldEquals(
            'Liquidation',
            id,
            'debtAmount',
            debtAmount.toString()
        );

        const alice = getOrInitUser(ALICE, event.block.timestamp);
        assert.bigIntEquals(alice.liquidationCount, BigInt.fromI32(1));
    });
});
