import { writeFileSync } from 'fs';
import { runner } from './node_runner';
import * as Main from './main';

const format = runner(Main.init, Main.view)();

writeFileSync('dist/client.html', format());
