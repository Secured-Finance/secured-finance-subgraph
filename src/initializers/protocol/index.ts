import { BigInt } from '@graphprotocol/graph-ts';
import { Protocol } from '../../../generated/schema';
import { PROTOCOL_ID } from '../../utils/constant';

export const getOrInitProtocol = (): Protocol => {
    let protocol = Protocol.load(PROTOCOL_ID);
    if (!protocol) {
        protocol = new Protocol(PROTOCOL_ID);
        protocol.totalUsers = BigInt.fromI32(0);
        protocol.save();
    }
    return protocol as Protocol;
};
