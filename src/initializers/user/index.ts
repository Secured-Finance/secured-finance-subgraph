import { BigInt, Bytes, log } from '@graphprotocol/graph-ts';
import { getOrInitProtocol } from '../protocol';
import { User } from '../../../generated/schema';

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
        const protocol = getOrInitProtocol();
        protocol.totalUsers = protocol.totalUsers.plus(BigInt.fromI32(1));
        protocol.save();
    }
    return user as User;
};
