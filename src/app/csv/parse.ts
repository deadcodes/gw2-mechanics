import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';

fs.createReadStream(path.resolve(__dirname, 'assets', 'parse.csv'))
    .pipe(csv.parse({ headers: true }))
    .on('error', error => console.error(error))
    .on('data', row => console.log(row))
    .on('end', (rowCount: number) => console.log(`Parsed ${rowCount} rows`));