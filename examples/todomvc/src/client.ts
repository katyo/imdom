import 'raf-polyfill';
import './style.css';
import { runner } from './runner';
import * as Main from './main';

runner(Main.init, Main.view)(document);
