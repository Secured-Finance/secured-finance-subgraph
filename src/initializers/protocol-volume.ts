import { BigInt, Bytes } from '@graphprotocol/graph-ts';
import { ProtocolVolumeByCurrency } from '../../generated/schema';
import { getOrInitProtocol } from './protocol';

export const initOrUpdateProtocolVolume = (
    amount: BigInt,
    currency: Bytes
): ProtocolVolumeByCurrency => {
    const protocol = getOrInitProtocol();
    let protocolVolume = ProtocolVolumeByCurrency.load(currency.toHexString());
    if (!protocolVolume) {
        protocolVolume = new ProtocolVolumeByCurrency(currency.toHexString());
        protocolVolume.protocol = protocol.id;
        protocolVolume.currency = currency;
        protocolVolume.totalVolume = amount;
    } else {
        protocolVolume.totalVolume = protocolVolume.totalVolume.plus(amount);
    }
    protocolVolume.save();
    return protocolVolume as ProtocolVolumeByCurrency;
};
