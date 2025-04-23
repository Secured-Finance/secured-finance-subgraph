import { readFileSync, writeFileSync } from 'fs';
import { dump, load } from 'js-yaml';

const arrowedNetworks = [
    'development',
    'development-arb',
    'development-fil',
    'staging',
    'staging-arb',
    'staging-fil',
    'sepolia',
    'mainnet',
    'arbitrum-sepolia',
    'arbitrum-one',
    'filecoin-mainnet',
] as const;
type Network = (typeof arrowedNetworks)[number];

const networkMap: Partial<Record<Network, string>> = {
    development: 'sepolia',
    'development-arb': 'arbitrum-sepolia',
    'development-fil': 'filecoin-testnet',
    staging: 'sepolia',
    'staging-arb': 'arbitrum-sepolia',
    'staging-fil': 'filecoin-testnet',
    'filecoin-mainnet': 'filecoin',
};

class Main {
    private network: Network;
    private isGoldsky: boolean;

    constructor(network: string, isGoldsky?: string) {
        if (!arrowedNetworks.includes(network as Network)) {
            console.error('Invalid network:', network);
            process.exit(1);
        }

        this.network = network as Network;
        this.isGoldsky = isGoldsky?.toLowerCase() === 'true' ? true : false;
    }

    async run() {
        const rootDir = process.cwd();
        const yamlText = readFileSync(`${rootDir}/subgraph.yaml`, 'utf8');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = load(yamlText) as any;
        const network = networkMap[this.network] || this.network;

        if (!network) {
            console.error('Network not found:', this.network);
            process.exit(1);
        }

        for (const dataSource of data.dataSources) {
            const deployment = await import(
                `@secured-finance/contracts/deployments/${this.network}/${dataSource.source.abi}.json`
            );

            const proxyAddress = deployment.address;
            dataSource.source.address = proxyAddress;
            dataSource.network = network;
            if (this.isGoldsky) {
                const blockNumber = deployment.receipt.blockNumber;
            dataSource.source.startBlock =
                typeof blockNumber === 'string' && blockNumber.startsWith('0x')
                    ? parseInt(blockNumber, 16)
                    : blockNumber;
            }
        }

        for (const template of data.templates) {
            template.network = network;
        }

        const newYamlText = dump(data);

        writeFileSync(
            `${rootDir}/subgraph.${this.network}.yaml`,
            newYamlText,
            'utf8'
        );
    }
}

const [, , network, isGoldsky] = process.argv;
new Main(network, isGoldsky).run();
