if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'underscore',
	'backbone',
	'when',

	'generic_store/generic_store',
	'base-objects/backbone/enhanced_change_monitor_mixin',
	'base-objects/backbone/sync_api_uniformization_mixin',
	'base-objects/backbone/spec/common_sync_api_spec',

	'base-objects/backbone/sync_to_store_mixin',

	'mocha'
],
function(chai, _, Backbone, when, GenericStore, BBEnhancedChangeMonitorMixin, BBSyncAPIUniformizationMixin, should_implement_backbone_sync_api, CUT) {
	"use strict";

	var expect = chai.expect;
	//chai.should();
	chai.Assertion.includeStack = true; // defaults to false

	// sync to store need a Backbone model with some enhancements
	var MUT = Backbone.Model.extend({urlRoot : '/test'});
	BBEnhancedChangeMonitorMixin.mixin(MUT.prototype); // needed
	BBSyncAPIUniformizationMixin.mixin(MUT.prototype); // needed
	CUT.mixin(MUT.prototype);


	describe('[Backbone Mixin] sync to store', function() {

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
				expect( tempfn ).to.throw(Error, "Backbone sync() to store mixin() must be passed a prototype !");
			});

		});

		describe('', function() {
			beforeEach(function(){
				this.CUT = CUT;
				this.TestModel = MUT.extend({});
				var store = GenericStore.make_new("memory");
				CUT.set_model_store(this.TestModel.prototype, store);
			});

			should_implement_backbone_sync_api();
		});


		describe('operations', function() {

			it('should correctly handle missing records', function(signalAsyncTestFinished) {
				var out = new MUT();
				var store = GenericStore.make_new("memory");
				out.set_store(store); // must give it a store to sync to
				out.id = 'toto'; // non-existent id

				var promise1 = out.fetch(); // should fail
				promise1.then(function(){
					// impossible
					console.error("impossible fetch succeeded !");
				});
				promise1.otherwise(function(infos) {
					expect( infos[1].message ).to.eq( "sync() to store : read : record not found !" );
					signalAsyncTestFinished();
				});
			});

			it('fetch should correctly overwrite unsaved changes', function(signalAsyncTestFinished) {
				var out = new MUT();
				var store = GenericStore.make_new("memory");
				out.set_store(store); // must give it a store to sync to
				out.set('foo', 'bar');

				var save_step = out.save();
				save_step.otherwise(function(infos) {
					console.error("save_step failure");
					console.error(arguments);
					expect(false).to.be.true;
				});

				// now synchronously modify local version even while it's (supposedly) being saved (somewhat race condition test)
				out.set('foo', 'barz');
				out.set('answer', 42); // new attrib

				// now read back
				var fetch_step = when.defer();
				save_step.then(function(){
					fetch_step.resolve( out.fetch() );
				});
				fetch_step.promise.otherwise(function(infos) {
					console.error("fetch_step failure");
					console.error(arguments);
				});

				// unsaved local changes should have been forgotten
				fetch_step.promise.then(function(){
					expect( out.attributes ).to.deep.equals({ 'foo': 'bar' });
					signalAsyncTestFinished();
				});
			});

			it('should allow single Creation, Read, Update, Delete', function(signalAsyncTestFinished) {
				var out = new MUT();
				var store = GenericStore.make_new("memory");
				out.set_store(store); // must give it a store to sync to

				// use all types to check if they are correctly persisted
				out.set('Tnull', null);
				out.set('Tundefined', undefined);
				out.set('Tstring', 'Hello world !');
				out.set('Tnumber', 123);
				out.set('Tnumber2', 456.789);
				out.set('Tboolean', false);
				out.set('Tarray', [ 'foo', 42 ]);
				out.set('Tobject', { 'foo': 'bar', 'answer' : 42});
				out.set('foo', 'bar');
				expect( out.id).to.be.undefined;
				// make a copy for comparison
				var attributes_snapshot = _.clone( out.attributes );

				var create_promise = out.save(); // will cause creation
				var create_step = when.defer();
				create_promise.then(function(){
					expect( out.id ).to.not.be.undefined;
					// also check change monitor
					expect( out.previous_attributes() ).to.deep.equals( attributes_snapshot );
					expect( out.changed_attributes() ).to.deep.equals( {} ); // since supposed to be in sync
					create_step.resolve(1);
				});
				create_promise.otherwise(function(){
					console.error("create_step failure");
					console.error(arguments);
				});

				var read_back_01_step = when.defer();
				create_step.promise.then(function() {
					console.log("starting read_back_01_step...");
					// now check that we can read back
					var out2 = new MUT();
					out2.set_store(store); // must give it a store to sync to
					out2.id = out.id; // set id explicitely
					var promise = out2.fetch(); // will fetch by id
					promise.then(function(){
						// also check change monitor
						expect( out2.changed_attributes() ).to.deep.equals( {} ); // since supposed to be in sync
						expect( out2.attributes ).to.deep.equals( attributes_snapshot ); // if unpersisted correctly
						read_back_01_step.resolve(1);
					});
					promise.otherwise(function(){
						console.error("read_back_01_step failure");
						console.error(arguments);
					});
				});

				var update_step = when.defer();
				read_back_01_step.promise.then(function() {
					console.log("starting update_step...");
					// now check that we can update
					out.set('foo', 53);
					// note : how to remove a field ? TODO
					out.set('answer', undefined);
					var promise = out.save(); // should trigger an update
					promise.then(function(){
						// also check change monitor
						expect( out.changed_attributes() ).to.deep.equals( {} ); // since supposed to be in sync
						update_step.resolve(1);
					});
					promise.otherwise(function(){
						console.error("update_step failure");
						console.error(arguments);
					});
				});

				// read back again and check props
				var read_back_02_step = when.defer();
				update_step.promise.then(function() {
					console.log("starting read_back_02_step...");
					// check that we can read back and that data is correct
					var out2 = new MUT();
					out2.set_store(store); // must give it a store to sync to
					out2.id = out.id;
					var promise = out2.fetch(); // fetch by id
					promise.then(function(){
						// also check change monitor
						expect( out2.changed_attributes() ).to.deep.equals( {} ); // since supposed to be in sync
						expect( out2.attributes ).to.deep.equals(_.extend({}, attributes_snapshot, { 'foo': 53, 'answer': undefined }) ); // should be up-to-date
						read_back_02_step.resolve(1);
					});
					promise.otherwise(function(){
						console.error("read_back_02_step failure !");
						console.error(arguments);
					});
				});

				// eventually delete it
				var destroy_step = when.defer();
				read_back_02_step.promise.then(function() {
					console.log("starting destroy_step...");
					var promise = out.destroy();
					promise.then(function(){
						// actual deletion will be checked in next step
						destroy_step.resolve(1);
					});
					promise.otherwise(function(){
						console.error("destroy_step failure !");
						console.error(arguments);
					});
				});

				destroy_step.promise.then(function() {
					console.log("starting final step...");
					// try to read to check if correctly deleted
					var promise = out.fetch(); // should fail
					promise.otherwise(function(infos) {
						expect( infos[1].message ).to.eq( "sync() to store : read : record not found !" );
						signalAsyncTestFinished();
					});
					promise.then(function(){
						console.error("read_back_03_step failure !");
						console.error(arguments);
					});
				});

			});

			it('should allow multiple Creation, Read, Update, Delete', function(signalAsyncTestFinished) {
				var out = new MUT();
				var store = GenericStore.make_new("memory");

				// this time we'll create several objects
				var out1 = new MUT({ name: 'one'});
				out1.set_store(store);
				var initial_save_step = out1.save();
				var out2 = new MUT({ name: 'two'});
				out2.set_store(store);
				initial_save_step = when.join(initial_save_step, out2.save());
				var out3 = new MUT({ name: 'three'});
				out3.set_store(store);
				initial_save_step = when.join(initial_save_step, out3.save());
				initial_save_step.otherwise(function(){
					console.error("initial_save failure !");
					console.error(arguments);
				});


				// OK we have (promised !) three records. Mess with them.
				var modif_step = when.defer();
				initial_save_step.then(function(){
					// modif #1
					out1.set("code", 1);
					var tmp_modif_step = out1.save();
					// destroy #2
					tmp_modif_step = when.join( modif_step, out2.destroy() );
					// modif #3
					out3.set({name: 'suii', "code": 3});
					tmp_modif_step = when.join( modif_step, out3.save() );
					modif_step.resolve( tmp_modif_step ); // promise magic is so convenient
				});
				modif_step.promise.otherwise(function(){
					console.error("modif_step failure !");
					console.error(arguments);
				});


				// ok now let's fetch them again to see if records didn't mess themselves
				modif_step.promise.then(function(){
					// fetch #1
					out1.set("code", 1);
					var tmp_modif_step = out1.fetch();
					// destroy #2
					tmp_modif_step = when.join( modif_step, out2.destroy() );
					// modif #3
					out3.set({name: 'suii', "code": 3});
					tmp_modif_step = when.join( modif_step, out3.save() );
					modif_step.resolve( tmp_modif_step ); // promise magic is so convenient
					signalAsyncTestFinished();
				});

			});

			it('should correctly allow attribute deletion');



			it('should also work with a model-wide store', function(signalAsyncTestFinished) {
				var MUTWS = MUT.extend({});
				var store = GenericStore.make_new("memory");
				CUT.set_model_store(MUTWS.prototype, store);

				// this time we'll create several objects
				var out1 = new MUTWS({ name: 'one'});
				var initial_save_step = out1.save();
				var out2 = new MUTWS({ name: 'two'});
				initial_save_step = when.join(initial_save_step, out2.save());
				var out3 = new MUTWS({ name: 'three'});
				initial_save_step = when.join(initial_save_step, out3.save());
				initial_save_step.otherwise(function(){
					console.error("initial_save failure !");
					console.error(arguments);
				});


				// OK we have (promised !) three records. Mess with them.
				var modif_step = when.defer();
				initial_save_step.then(function(){
					// modif #1
					out1.set("code", 1);
					var tmp_modif_step = out1.save();
					// destroy #2
					tmp_modif_step = when.join( modif_step, out2.destroy() );
					// modif #3
					out3.set({name: 'suii', "code": 3});
					tmp_modif_step = when.join( modif_step, out3.save() );
					modif_step.resolve( tmp_modif_step ); // promise magic is so convenient
				});
				modif_step.promise.otherwise(function(){
					console.error("modif_step failure !");
					console.error(arguments);
				});


				// ok now let's fetch them again to see if records didn't mess themselves
				modif_step.promise.then(function(){
					// fetch #1
					out1.set("code", 1);
					var tmp_modif_step = out1.fetch();
					// destroy #2
					tmp_modif_step = when.join( modif_step, out2.destroy() );
					// modif #3
					out3.set({name: 'suii', "code": 3});
					tmp_modif_step = when.join( modif_step, out3.save() );
					modif_step.resolve( tmp_modif_step ); // promise magic is so convenient
					signalAsyncTestFinished();
				});

			});

		});

	}); // describe CUT
}); // requirejs module
