import { existsSync, mkdirSync, rmSync, copyFileSync } from 'fs';
import glob from 'glob';

class Main {
    run() {
        const rootDir = process.cwd();
        const modulePath = require
            .resolve('@secured-finance/contracts/package.json')
            .replace('/package.json', '');

        const abiDir = `${rootDir}/abis`;
        if (existsSync(abiDir)) {
            rmSync(abiDir, { recursive: true });
        }
        mkdirSync(abiDir);

        // Add the contracts used in the
        const filesToCopy = [
            'LendingMarketOperationLogic.json',
            'TokenVault.json',
            'FundManagementLogic.json',
            'LiquidationLogic.json',
            'OrderActionLogic.json',
            'OrderBookLogic.json',
        ];

        filesToCopy.forEach(file => {
            const filePaths = glob.sync(
                `${modulePath}/build/contracts/**/${file}`
            );

            filePaths.forEach(filePath => {
                const destinationPath = `${abiDir}/${filePath
                    .split('/')
                    .pop()}`;
                copyFileSync(filePath, destinationPath);
            });
        });
    }
}

new Main().run();
