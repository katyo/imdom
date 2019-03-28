import { doctype, tag, end, text, once, iattr, attr } from 'imdom';

const empty_object = {};
const empty_array: any[] = [];
const empty_string = "";

export interface ResourceLink {
    link: string;
};

export interface ResourceData {
    data: string;
};

export type Resource = ResourceLink | ResourceData;

export interface Props {
    styles: Resource[];
    scripts: Resource[];
    charset: string;
    compat: string;
    settings: Record<string, string>;
    title: string;
    description: string;
    author: string;
    keywords: string[];
    baseHref: string;
    baseTarget: string;
};

export function page<Args extends any[]>({
    scripts = empty_array,
    styles = empty_array,
    charset = 'UTF-8',
    compat = 'IE=edge,chrome=1',
    settings = empty_object as Record<string, string>,
    title = empty_string,
    description = empty_string,
    author = empty_string,
    keywords = empty_array,
    baseHref = empty_string,
    baseTarget = empty_string,
}: Partial<Props>, nodes: (...args: Args) => void, ...args: Args): void {
    doctype('html');
    tag('html'); {
        tag('head'); {
            tag('meta'); {
                if (once()) {
                    iattr('charset', charset);
                }
            } end();
            tag('meta'); {
                if (once()) {
                    iattr('http-equip', 'X-UA-Compatible');
                    iattr('content', compat);
                }
            } end();
            for (const name in settings) {
                tag('meta'); {
                    if (once()) {
                        iattr('name', name);
                        iattr('content', settings[name]);
                    }
                } end();
            }
            for (const res of styles) {
                if ('link' in res) {
                    tag('link'); {
                        if (once()) {
                            iattr('href', (res as ResourceLink).link);
                            iattr('rel', 'stylesheet');
                        }
                    } end();
                } else {
                    tag('style'); {
                        text((res as ResourceData).data);
                    } end();
                }
            }
            if (keywords && keywords.length > 0) {
                tag('meta'); {
                    if (once()) {
                        iattr('name', 'keywords');
                    }
                    attr('content', keywords.join(' '));
                } end();
            }
            if (baseHref || baseTarget) {
                tag('base'); {
                    if (once()) {
                        iattr('href', baseHref);
                        iattr('target', baseTarget);
                    }
                } end();
            }
            if (description) {
                tag('meta'); {
                    if (once()) {
                        iattr('name', 'description');
                        iattr('content', description);
                    }
                } end();
            }
            if (author) {
                tag('meta'); {
                    if (once()) {
                        iattr('name', 'author');
                    }
                    attr('content', author);
                } end();
            }
            if (title) {
                tag('title'); {
                    text(title);
                } end();
            }
        } end();
        tag('body'); {
            nodes(...args);
            for (const res of scripts) {
                if ('link' in res) {
                    tag('script'); {
                        if (once()) {
                            iattr('src', (res as ResourceLink).link);
                        }
                    } end();
                } else {
                    tag('script'); {
                        text((res as ResourceData).data);
                    } end();
                }
            }
        } end();
    } end();
}

export interface PropsLite {
    styles: Resource[];
    scripts: Resource[];
    compat: string;
    settings: Record<string, string>;
    title: string;
};

export function page_lite<Args extends any[]>({
    scripts = empty_array,
    styles = empty_array,
    compat = 'IE=edge,chrome=1',
    settings = empty_object as Record<string, string>,
    title = empty_string,
}: Partial<PropsLite>, nodes: (...args: Args) => void, ...args: Args) {
    doctype('html');
    tag('html'); {
        tag('head'); {
            tag('meta'); {
                if (once()) {
                    iattr('charset', 'UTF-8');
                }
            } end();
            tag('meta'); {
                if (once()) {
                    iattr('http-equip', 'X-UA-Compatible');
                    iattr('content', compat);
                }
            } end();
            for (const name in settings) {
                tag('meta'); {
                    if (once()) {
                        iattr('name', name);
                        iattr('content', settings[name]);
                    }
                } end();
            }
            for (const res of styles) {
                if ('link' in res) {
                    tag('link'); {
                        if (once()) {
                            iattr('href', (res as ResourceLink).link);
                            iattr('rel', 'stylesheet');
                        }
                    } end();
                } else {
                    tag('style'); {
                        text((res as ResourceData).data);
                    } end();
                }
            }
            if (title) {
                tag('title'); {
                    text(title);
                } end();
            }
        } end();
        tag('body'); {
            nodes(...args);
            for (const res of scripts) {
                if ('link' in res) {
                    tag('script'); {
                        if (once()) {
                            iattr('src', (res as ResourceLink).link);
                        }
                    } end();
                } else {
                    tag('script'); {
                        text((res as ResourceData).data);
                    } end();
                }
            }
        } end();
    } end();
}
