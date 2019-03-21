import { declare } from "@babel/helper-plugin-utils";
import jsx from "@babel/plugin-syntax-jsx";
import * as t from "@babel/types";

export default declare((api, options) => {
  api.assertVersion(7);
  
  // returns a closure that returns an identifier or memberExpression node
  // based on the given id
  const createIdentifierParser = id => () => {
    return id
      .split(".")
      .map(name => t.identifier(name))
      .reduce((object, property) => t.memberExpression(object, property));
  };

  let module_identifier;

  function apiCallExpr(name, ...args) {
    return t.callExpression(t.memberExpression(module_identifier, t.identifier(name)), args);
  }

  function apiCallStmt(name, ...args) {
    return t.expressionStatement(apiCallExpr(name, ...args));
  }

  /*function getAttributeValue(openingElement, name) {
    for (const attribute of openingElement.attributes) {
      if (t.isJSXIdentifier(attribute.name, {name})) {
        return attribute.value;
      }
    }
  }*/

  function getImmutable(expression) {
    return expression === null ? null :
      t.isStringLiteral(expression) ? expression :
      t.isJSXExpressionContainer(expression) &&
      t.isLiteral(expression.expression) ?
      expression.expression : void 0;
  }

  function getMutable(expression) {
    return t.isJSXExpressionContainer(expression) &&
      !t.isLiteral(expression.expression) ?
      expression.expression : void 0;
  }

  function makeSelector(openingElement) {
    const { name: tag } = openingElement.name;
    
    let id, cls;
    
    for (const attribute of openingElement.attributes) {
      if (t.isJSXIdentifier(attribute.name, {name: 'id'})) {
        const val = getImmutable(attribute.value);
        
        if (val) {
          if (id) {
            throw path.buildCodeFrameError("Multiple 'id' attributes is not allowed.");
          }
          
          if (!t.isStringLiteral(val)) {
            throw path.buildCodeFrameError("Id attribute must be string literal.");
          }
          
          id = val.value;
        }
      }
    }

    for (const attribute of openingElement.attributes) {
      if (t.isJSXIdentifier(attribute.name, {name: 'class'})) {
        const val = getImmutable(attribute.value);
        if (val) {
          if (!t.isStringLiteral(val)) {
            throw path.buildCodeFrameError("Class attribute must be string literal.");
          }
          
          const lst = val.value.split(/\s+/);
          
          if (cls) {
            cls = [...cls, ...lst];
          } else {
            cls = lst;
          }
        }
      }
    }
    
    return t.stringLiteral(
      tag
        + (id ? '#' + id : '')
        + (cls ? '.' + cls.join('.') : '')
    );
  }

  const specialAttributes = {
    id: true,
    class: true,
    style: true,
    'data-key': true,
  };

  function makeImmutableAttributes(attributes) {
    const out = [];
    
    for (const attribute of attributes) {
      if (t.isJSXIdentifier(attribute.name) &&
          !specialAttributes[attribute.name.name]) {
        let val = getImmutable(attribute.value);
        
        if (val !== undefined) {
          out.push(val !== null ?
                   apiCallStmt('iattr', t.stringLiteral(attribute.name.name), val) :
                   apiCallStmt('iattr', t.stringLiteral(attribute.name.name))
                  );
        }
      }
    }
    
    return out;
  }

  function makeMutableAttributes(attributes) {
    const out = [];
    
    for (const attribute of attributes) {
      if (t.isJSXIdentifier(attribute.name) &&
          !specialAttributes[attribute.name.name]) {
        let val = getMutable(attribute.value);
        
        if (val) {
          out.push(apiCallStmt('attr', t.stringLiteral(attribute.name.name), val));
        }
      }
    }
    
    return out;
  }

  function conditionalExpressionClass(expression) {
    if (t.isStringLiteral(expression)) {
      if (expression.value) {
        const lst = expression.value.split(/\s+/);
        if (lst.length == 1) {
          return apiCallStmt('class_', expression);
        } else if (lst.length > 0) {
          return t.blockStatement(
            lst.filter(name => name.length > 0)
              .map(name => apiCallStmt('class_', t.stringLiteral(name)))
          );
        }
      }
    } else if (t.isIdentifier(expression)) {
      return apiCallStmt('class_', expression);
    } else if (t.isConditionalExpression(expression)) {
      return t.ifStatement(
        expression.test,
        conditionalExpressionClass(expression.consequent),
        conditionalExpressionClass(expression.alternate)
      );
    } else {
      throw path.buildCodeFrameError("Class attributes support only identifiers, string literals or sub expressions.");
    }
    //return t.expressionStatement(t.identifier('undefined'));
  }

  function makeMutableClasses(attributes) {
    const out = [];
    
    for (const attribute of attributes) {
      if (t.isJSXIdentifier(attribute.name, {name: 'class'})) {
        let val = getMutable(attribute.value);
        
        if (val) {
          if (t.isObjectExpression(val)) {
            for (const property of val.properties) {
              //if (!t.isLiteral(property.value)) {
              if (!t.isIdentifier(property.key) && !t.isStringLiteral(property.key)) {
                throw path.buildCodeFrameError("Class name should be a string literal or identifier.");
              }
              out.push(t.ifStatement(
                property.value,
                apiCallStmt('class_', property.key)
              ));
              //}
            }
          } else {
            out.push(conditionalExpressionClass(val));
          }
        }
      }
    }
    
    return out;
  }
  
  function makeImmutableStyles(attributes) {
    const out = [];
    
    for (const attribute of attributes) {
      if (t.isJSXIdentifier(attribute.name, {name: 'style'})) {
        let val = getImmutable(attribute.value);
        
        if (val) {
          if (t.isObjectExpression(val)) {
            for (const property of val.properties) {
              if (!t.isIdentifier(property.key) &&
                  !t.isStringLiteral(property.key)) {
                throw path.buildCodeFrameError("Style property name should be a string literal or identifier.");
              }
              out.push(apiCallStmt('istyle', property.key, property.value));
            }
          } else {
            throw path.buildCodeFrameError("Style attribute value should be an object expression.");
          }
        }
      }
    }
    
    return out;
  }

  function makeElement(node) {
    const out = [];
    
    // open tag
    out.push(apiCallStmt('tag', makeSelector(node.openingElement)));
    
    const iattrs = makeImmutableAttributes(node.openingElement.attributes);
    const istyles = makeImmutableStyles(node.openingElement.attributes);
    const ievents = makeEventHandlers(node.openingElement.attributes);
    
    if (iattrs.length || istyles.length || ievents.length) {
      out.push(t.ifStatement(
        apiCallExpr('detached'),
        t.blockStatement([...iattrs, ...istyles, ...ievents])
      ));
    }

    const classes = makeMutableClasses(node.openingElement.attributes);
    
    if (classes.length) {
      out.splice(out.length, 0, ...classes);
    }
    
    const attrs = makeMutableAttributes(node.openingElement.attributes);
    
    if (attrs.length) {
      out.splice(out.length, 0, ...attrs);
    }

    const styles = makeMutableStyles(node.openingElement.attributes);
    
    if (styles.length) {
      out.splice(out.length, 0, ...styles);
    }

    if (node.children.length) {
      out.splice(out.length, 0, ...node.children);
    }
    
    // close tag
    out.push(apiCallStmt('end'));

    return out;
  }

  const visitor = {
    Program(path) {
      // we intend to add IMDOM import declaration
      module_identifier = path.scope.generateUidIdentifier("imdom");
      
      path.unshiftContainer('body', t.importDeclaration([
        t.importNamespaceSpecifier(module_identifier)
      ], t.stringLiteral('imdom')));
    },

    ExpressionStatement: {
      enter(path) {
        if (!t.isJSXFragment(path.node.expression) &&
            !t.isJSXElement(path.node.expression)) {
          return;
        }
      },

      exit(path) {
        //console.log(path.node.expression);
        //path.replaceWith(path.node.expression);
      }
    },

    JSXText: {
      exit(path) {
        path.replaceWith(apiCallStmt('text', t.stringLiteral(path.node.value)));
      }
    },
    
    JSXElement: {
      exit(path) {
        // replace jsx element
        path.replaceWithMultiple(makeElement(path.node));
      }
    },

    JSXFragment: {
      exit(path) {
        // replace jsx fragment
        path.replaceWithMultiple(path.node.children);
      }
    }
  };

  return {
    name: "transform-imdom-jsx",
    inherits: jsx,
    visitor,
  };
});
