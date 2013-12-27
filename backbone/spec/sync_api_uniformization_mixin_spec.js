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

			it('should work', function(signalAsyncTestFinished) {
				var MUT = Backbone.Model.extend({});
				CUT.mixin(MUT.prototype);

				var out = new MUT();

				// now test all funcs
				var p_save        = out.save();
				var save_check    = when.defer();
				var p_fetch       = out.fetch();
				var fetch_check   = when.defer();
				var p_destroy     = out.destroy();
				var destroy_check = when.defer();
				var p_sync        = out.sync();
				var sync_check    = when.defer();
				var p_find        = out.find();
				var find_check    = when.defer();

				expect( when.isPromiseLike( p_save    ) ).to.be.true;
				expect( when.isPromiseLike( p_fetch   ) ).to.be.true;
				expect( when.isPromiseLike( p_destroy ) ).to.be.true;
				expect( when.isPromiseLike( p_sync    ) ).to.be.true;
				expect( when.isPromiseLike( p_find    ) ).to.be.true;

				p_save.otherwise(function(arr) {
					expect( arr.length ).to.eq(2);
					expect( arr[1] ).to.be.an.instanceof( Error );
					// backbone exception proving that the original backbone func was called
					expect( arr[1].message ).to.eq( 'A "url" property or function must be specified' );
					save_check.resolve(1);
				});
				p_fetch.otherwise(function(arr) {
					expect( arr.length ).to.eq(2);
					expect( arr[1] ).to.be.an.instanceof( Error );
					// backbone exception proving that the original backbone func was called
					expect( arr[1].message ).to.eq( 'A "url" property or function must be specified' );
					fetch_check.resolve(1);
				});
				p_destroy.otherwise(function(arr) {
					expect( arr.length ).to.eq(2);
					expect( arr[1] ).to.be.an.instanceof( Error );
					// backbone exception proving that the original backbone func was called
					expect( arr[1].message ).to.eq( 'From Backbone sync uniformization : underlying sync func returned false !' );
					destroy_check.resolve(1);
				});
				p_sync.otherwise(function(arr) {
					expect( arr.length ).to.eq(2);
					expect( arr[1] ).to.be.an.instanceof( Error );
					// backbone exception proving that the original backbone func was called
					expect( arr[1].message ).to.eq( 'A "url" property or function must be specified' );
					sync_check.resolve(1);
				});
				p_find.otherwise(function(arr) {
					expect( arr.length ).to.eq(2);
					expect( arr[1] ).to.be.an.instanceof( Error );
					// backbone exception proving that the original backbone func was called
					expect( arr[1].message ).to.eq( "From Backbone sync uniformization : find() not available for this model !" );
					find_check.resolve(1);
				});

				when
					.join(save_check.promise, fetch_check.promise, destroy_check.promise, sync_check.promise, find_check.promise)
					.then(function() {
						signalAsyncTestFinished();
					}); // no direct call to signalAsyncTestFinished since it doesn't like params
			});


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

				when
					.join(p_save, p_fetch, p_destroy, p_sync)
					.then(function() {
						signalAsyncTestFinished();
					}); // no direct call to signalAsyncTestFinished since it doesn't like params
			});

		});

	}); // describe CUT
}); // requirejs module
