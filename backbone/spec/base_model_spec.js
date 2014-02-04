if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'backbone',
	'when',
	'base-objects/backbone/extensible_model',

	'base-objects/backbone/base_model',

	'mocha'
],
function(chai, Backbone, when, ExtensibleModel, CUT) {
	"use strict";

	var expect = chai.expect;
	//chai.should();
	chai.Assertion.includeStack = true; // defaults to false


	describe('Backbone Base Model', function() {

		describe('instanciation', function() {

			it('should work', function() {
				var out = new CUT();
				// yes that's all. basic of the basic.
			});

			it('should show correct inheritance', function() {
				var out = new CUT();
				expect( out ).to.be.an.instanceof(CUT);
				expect( out ).to.be.an.instanceof(ExtensibleModel);
				expect( out ).to.be.an.instanceof(Backbone.Model);
			});

		});

		describe('features', function() {

			it('should include Enhanced Change Monitor', function() {
				var out = new CUT();
				expect( out ).to.respondTo('declare_in_sync');
			});

			it('should include sync() API Uniformization', function(signalAsyncTestFinished) {
				var out = new CUT();

				var promise = out.save(); // should fail of course

				expect( when.isPromiseLike(promise) );

				promise.then(function() {
					signalAsyncTestFinished(new Error("Promise succeeded unexpectedly !"));
				},
				function(e) {
					try {
						expect(e.message ).to.equals( 'A "url" property or function must be specified' );
						signalAsyncTestFinished();
					}
					catch(e) {
						signalAsyncTestFinished(e);
					}
				})
			});

		});

	}); // describe CUT
}); // requirejs module
