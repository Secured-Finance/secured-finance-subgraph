import { Withdraw } from '../../generated/TokenVault/TokenVault';
import { initTransfer } from '../initializers';

export function handleWithdraw(event: Withdraw): void {
    const id =
        event.transaction.hash.toHexString() + ':' + event.logIndex.toString();
    initTransfer(
        id,
        event.params.user,
        event.params.ccy,
        event.params.amount,
        'Withdraw',
        event.block.timestamp,
        event.block.number,
        event.transaction.hash
    );
}
