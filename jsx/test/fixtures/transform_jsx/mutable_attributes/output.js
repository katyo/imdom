import * as _imdom from "imdom";

_imdom.text("\n    ");

_imdom.tag("a"), _imdom.attr("href", link_url), _imdom.end();

_imdom.text("\n    ");

_imdom.tag("input"), _imdom.attr("type", field.type), _imdom.attr("disabled", !field.enabled), _imdom.end();

_imdom.text("\n");
