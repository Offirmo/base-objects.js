test:
	rm -rf node_modules/base-objects
	mkdir node_modules/base-objects
	cp -r ../backbone node_modules/base-objects
	cp -r ../offinh node_modules/base-objects
	./node_modules/.bin/mocha \
		--debug \
		--reporter nyan \
		--check-leaks \
		--require tests_init.js \
		node_modules/base-objects/offinh/spec/* \
		node_modules/base-objects/backbone/spec/*

run:
	./run.sh

.PHONY: test
