import 'raf-polyfill';
import './style.css';
import { runner } from './runner';
import { init, view } from './main';

runner(init, view)(document);
