export class OrderStatus {
    static readonly Open: string = 'Open';
    static readonly PartiallyFilled: string = 'PartiallyFilled';
    static readonly Filled: string = 'Filled';
    static readonly Killed: string = 'Killed';
    static readonly Cancelled: string = 'Cancelled';
}

export class OrderType {
    static readonly Limit: string = 'Limit';
    static readonly Market: string = 'Market';
    static readonly Unwind: string = 'Unwind';
}

export class TransactionType {
    static readonly Maker: string = 'Maker';
    static readonly Taker: string = 'Taker';
}
