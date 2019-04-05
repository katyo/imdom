import { JSDOM } from 'jsdom';

const { window: { document } } = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');

(global as any).document = document;

import './index';
