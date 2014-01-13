test: module_under_test_copied
	./node_modules/.bin/mocha \
		--debug \
		--reporter nyan \
		--check-leaks \
		--require tests_init.js \
		node_modules/base-objects/mixins/spec/* \
		node_modules/base-objects/offinh/spec/* \
		node_modules/base-objects/backbone/spec/*

module_under_test_copied: deps_installed
	rm -rf node_modules/base-objects
	mkdir  node_modules/base-objects
	cp -Lr  ../backbone     node_modules/base-objects
	cp -Lr  ../offinh       node_modules/base-objects
	cp -Lr  ../mixins       node_modules/base-objects
	cp -Lr  ../package.json node_modules/base-objects
	cp -Lr  ../README.md    node_modules/base-objects
	cp -Lr ../node_modules node_modules/base-objects

deps_installed:
	npm install

debug:
	@echo "Remember to run an instance of : node tcpproxy.js 5858 127.0.0.1 8585 !"
	./node_modules/.bin/mocha \
		--debug \
		--require tests_init.js \
		node_modules/base-objects/backbone/spec/*

debug1:
	@echo "Remember to run an instance of : node tcpproxy.js 5858 127.0.0.1 8585 !"
	node --debug-brk=8585 --debug tests_init.js

.PHONY: test
