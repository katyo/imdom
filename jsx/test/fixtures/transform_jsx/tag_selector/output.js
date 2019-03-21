import * as _imdom from "imdom";

function view() {
  _imdom.text("\n    ");

  _imdom.tag("div"), _imdom.end();

  _imdom.text("\n    ");

  _imdom.tag("div#some-id"), _imdom.end();

  _imdom.text("\n    ");

  _imdom.tag("div.some-class"), _imdom.end();

  _imdom.text("\n    ");

  _imdom.tag("div.some-class.other-class"), _imdom.end();

  _imdom.text("\n    ");

  _imdom.tag("div.some-class.other-class"), _imdom.end();

  _imdom.text("\n    ");

  _imdom.tag("div#some-id.some-class"), _imdom.end();

  _imdom.text("\n    ");

  _imdom.tag("div#some-id.some-class.other-class"), _imdom.end();

  _imdom.text("\n    ");

  _imdom.tag("div#some-id"), _imdom.end();

  _imdom.text("\n    ");

  _imdom.tag("div.some-class.other-class"), _imdom.end();

  _imdom.text("\n");
}
