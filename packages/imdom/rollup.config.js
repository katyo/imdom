import { lib, test } from '../../scripts/rollup.config';
import pkg from './package.json';

export default process.env.JS_TEST ? test(pkg) : lib(pkg);
