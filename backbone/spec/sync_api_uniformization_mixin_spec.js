if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'underscore',
	'backbone',
	'when',

	'base-objects/backbone/sync_api_uniformization_mixin',

	'mocha'
],
function(chai, _, Backbone, when, CUT) {
	"use strict";

	var expect = chai.expect;
	//chai.should();
	chai.Assertion.includeStack = true; // defaults to false

	describe('[Backbone Mixin] sync API uniformization', function() {

		describe('mixin()', function() {


			it('should mix !', function() {
				var MUT = Backbone.Model.extend({});
				CUT.mixin(MUT.prototype);

				var out = new MUT();

				// yes that's all. basic of the basic.
			});


			it('should prevent a common param error', function() {
				var MUT = Backbone.Model.extend({});

				var tempfn = function() { CUT.mixin(MUT); }; // bad bad we should have passed the prototype
				expect( tempfn ).to.throw(Error, "Backbone sync uniformization mixin() must be passed a prototype !");
			});

		});

		describe('', function() {

			it('should work on a disconnected HTTP endpoint', function(signalAsyncTestFinished) {
				var MUT = Backbone.Model.extend({});
				CUT.mixin(MUT.prototype);

				var out = new MUT();

				// now test all funcs
				var raw_save        = out.save();
				var raw_fetch       = out.fetch();
				var raw_destroy     = out.destroy();
				//var p_sync        = out.sync();
				var raw_find        = out.find();

				expect( when.isPromiseLike( raw_save    ) ).to.be.true;
				expect( when.isPromiseLike( raw_fetch   ) ).to.be.true;
				expect( when.isPromiseLike( raw_destroy ) ).to.be.true;
				//expect( when.isPromiseLike( p_sync    ) ).to.be.true;
				expect( when.isPromiseLike( raw_find    ) ).to.be.true;

				var p_save = raw_save.then(function() { throw new Error("raw_save succeeded unexpectedly !"); },
				function(e) {
					expect( e ).to.be.an.instanceof( Error );
					// backbone exception proving that the original backbone func was called
					expect( e.message ).to.eq( 'A "url" property or function must be specified' );
				});
				var p_fetch = raw_fetch.then(function() { throw new Error("raw_fetch succeeded unexpectedly !"); },
				function(e) {
					expect( e ).to.be.an.instanceof( Error );
					// backbone exception proving that the original backbone func was called
					expect( e.message ).to.eq( 'A "url" property or function must be specified' );
				});
				var p_destroy = raw_destroy.then(function() { throw new Error("raw_destroy succeeded unexpectedly !"); },
				function(e) {
					expect( e ).to.be.an.instanceof( Error );
					// backbone exception proving that the original backbone func was called
					expect( e.message ).to.eq( 'From Backbone sync uniformization : underlying sync func returned false !' );
				});
				/*p_sync.otherwise(function(arr) {
					expect( arr.length ).to.eq(2);
					expect( arr[1] ).to.be.an.instanceof( Error );
					// backbone exception proving that the original backbone func was called
					expect( arr[1].message ).to.eq( 'A "url" property or function must be specified' );
				});*/
				var p_find = raw_find.then(function() { throw new Error("raw_find succeeded unexpectedly !"); },
				function(e) {
					expect( e ).to.be.an.instanceof( Error );
					// backbone exception proving that the original backbone func was called
					expect( e.message ).to.eq( "find() is not implemented for now !" );
				});

				when
					.join(p_save, p_fetch, p_destroy, /*sync_check.promise,*/ p_find)
					.then(function() {
						signalAsyncTestFinished();
					},
					function(e) {
						signalAsyncTestFinished( e );
					}); // no direct call to signalAsyncTestFinished since it doesn't like params
			});

			// alas, it's hard to unit test...
			it('should work on a connected HTTP endpoint');

			it('should encapsulate immediate ancestor funcs', function(signalAsyncTestFinished) {
				var calls = [];

				var TestModel = Backbone.Model.extend({});
				TestModel.prototype.save = function() {
					calls.push('save');
					return when.resolve(1);
				};
				TestModel.prototype.fetch = function() {
					calls.push('fetch');
					return when.resolve(1);
				};
				TestModel.prototype.destroy = function() {
					calls.push('destroy');
					return when.resolve(1);
				};
				TestModel.prototype.sync = function() {
					calls.push('sync');
					return when.resolve(1);
				};

				var MUT = TestModel.extend({});
				CUT.mixin(MUT.prototype);

				var out = new MUT();

				// now test all funcs
				var p_save        = out.save();
				var p_fetch       = out.fetch();
				var p_destroy     = out.destroy();
				var p_sync        = out.sync();

				expect( when.isPromiseLike( p_save    ) ).to.be.true;
				expect( when.isPromiseLike( p_fetch   ) ).to.be.true;
				expect( when.isPromiseLike( p_destroy ) ).to.be.true;
				expect( when.isPromiseLike( p_sync    ) ).to.be.true;

				when.join(p_save, p_fetch, p_destroy, p_sync).then(function() {
					signalAsyncTestFinished();
				},
				function(e) {
					signalAsyncTestFinished(e);
				});
			});

		});

	}); // describe CUT
}); // requirejs module
