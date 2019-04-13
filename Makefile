packages := imdom imdom-highlight
examples := todomvc sierpinski wemacs
Q :=

default: prepare build test

npm/prepare: packages/prepare packages/build

root/prepare:
	$(Q)test -d node_modules || npm install

root/proper:
	$(Q)rm -rf node_modules package-lock.json

prepare: root/prepare packages/prepare
build: packages/build
test: packages/test
pack: packages/pack
publish: packages/publish
clean: packages/clean examples/clean
proper: packages/proper examples/proper root/proper

define PackagesRules # package, action
packages/$(2): package/$(1)/$(2)
endef

package.actions := prepare build test pack publish clean proper

define PackageRules # package
$$(foreach action,$(package.actions),$$(eval $$(call PackagesRules,$(1),$$(action))))
package/$(1)/prepare:
	$(Q)cd packages/$(1) && npm install
package/$(1)/build:
	$(Q)cd packages/$(1) && npm run dist
package/$(1)/test:
	$(Q)cd packages/$(1) && npm test
package/$(1)/pack:
	$(Q)cd packages/$(1) && npm pack
	$(Q)mkdir -p packs && mv packages/$(1)/*.tgz packs
package/$(1)/publish:
	$(Q)cd packages/$(1) && npm publish
package/$(1)/clean:
	$(Q)cd packages/$(1) && npm run clean
package/$(1)/proper:
	$(Q)cd packages/$(1) && rm -rf dist node_modules package-lock.json
endef

$(foreach package,$(packages),$(eval $(call PackageRules,$(package))))

define ExamplesRules # example, action
examples/$(2): example/$(1)/$(2)
endef

example.actions := prepare build clean proper

define ExampleRules # example
$$(foreach action,$(example.actions),$$(eval $$(call ExamplesRules,$(1),$$(action))))
example/$(1)/prepare:
	$(Q)cd examples/$(1) && npm install
example/$(1)/build:
	$(Q)cd examples/$(1) && npm run build
example/$(1)/clean:
	$(Q)cd examples/$(1) && npm run clean
example/$(1)/proper:
	$(Q)cd examples/$(1) && rm -rf dist node_modules package-lock.json
endef

$(foreach example,$(examples),$(eval $(call ExampleRules,$(example))))
