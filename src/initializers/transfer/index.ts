import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';
import { getOrInitUser } from '../user';
import { Deposit, Transfer } from '../../../generated/schema';

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
