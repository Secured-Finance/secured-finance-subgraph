import { Deposit, Withdraw } from '../../generated/TokenVault/TokenVault';
import { sendPushNotification } from '../helper/PushNotification';
import { initTransfer } from '../helper/initializer';

export function handleDeposit(event: Deposit): void {
    const id =
        event.transaction.hash.toHexString() + ':' + event.logIndex.toString();
    initTransfer(
        id,
        event.params.user,
        event.params.ccy,
        event.params.amount,
        'Deposit',
        event.block.timestamp,
        event.block.number,
        event.transaction.hash
    );

    let type = '3';
    let title = 'Deposit';
    let body = `Deposited`;
    let subject = 'PUSH Received';
    let message = `Received`;
    let cta = 'https://push.org/';

    let notification = `{\"type\": \"${type}\", \"title\": \"${title}\", \"body\": \"${body}\", \"subject\": \"${subject}\", \"message\": \"${message}\", \"cta\": \"${cta}\"}`;

    sendPushNotification(event.params.user.toHexString(), notification);
}

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

    let type = '3';
    let title = 'Withdraw';
    let body = 'Withdraw';
    let subject = 'PUSH Withdraw';
    let message = 'Received';
    let cta = 'https://push.org/';

    let notification = `{\"type\": \"${type}\", \"title\": \"${title}\", \"body\": \"${body}\", \"subject\": \"${subject}\", \"message\": \"${message}\", \"cta\": \"${cta}\"}`;

    sendPushNotification(event.params.user.toHexString(), notification);
}
