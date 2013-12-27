/* Shared tests for compliance to the Backbone sync API
 * >>> this.CUT MUST be set to the class under test
 *     and this.TestModel to the Model to use.
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'when',
	'mocha'
],
function(chai, when) {
	"use strict";

	var expect = chai.expect;

	var should_implement_backbone_sync_api = function() {

		describe('Backbone sync API implementation [shared]', function() {

			describe('operations', function() {

				it('should correctly handle missing records', function(signalAsyncTestFinished) {
					var out = new this.TestModel();
					out.id = 'toto'; // non-existent id

					var promise1 = out.fetch(); // should fail
					promise1.then(function(){
						// impossible
						console.error("impossible fetch succeeded !");
					});
					promise1.otherwise(function(infos) {
						expect( infos[1] ).to.be.instanceOf(Error);
						signalAsyncTestFinished();
					});
				});

				it('fetch should correctly overwrite unsaved changes', function(signalAsyncTestFinished) {
					var out = new this.TestModel();
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
					var TestModel = this.TestModel;
					var out = new TestModel();

					// use all types to check if they are correctly persisted
					out.set('Tnull', null);
					//out.set('Tundefined', undefined);
					out.set('Tstring', 'Hello world !');
					out.set('Tnumber', 123);
					out.set('Tnumber2', 456.789);
					out.set('Tboolean', false);
					out.set('Tarray', [ 'foo', 42 ]);
					out.set('Tobject', { 'foo': 'bar', 'answer' : 42});
					out.set('foo', 'bar');
					expect( out.id ).to.be.undefined;
					// make a copy for comparison
					var attributes_snapshot = _.clone( out.attributes );

					var create_promise = out.save(); // will cause creation
					var create_step = when.defer();
					create_promise.then(function(){
						expect( out.id ).to.not.be.undefined;
						// also check change monitor
						expect( out.previous_attributes() ).to.deep.equals( attributes_snapshot );
						expect( out.changed_attributes() ).to.deep.equals( {} ); // since supposed to be in sync
						create_step.resolve(out.id);
					});
					create_promise.otherwise(function(){
						console.error("create_step failure");
						console.error(arguments);
					});

					var read_back_01_step = when.defer();
					create_step.promise.then(function(id) {
						console.log("[single CRUD] starting read_back_01_step...");
						// now check that we can read back
						var out2 = new TestModel();
						out2.id = id; // set id explicitely
						var promise = out2.fetch(); // will fetch by id
						promise.then(function(){
							// also check change monitor
							expect( out2.changed_attributes() ).to.deep.equals( {} ); // since supposed to be in sync
							expect( out2.attributes ).to.deep.equals( attributes_snapshot ); // if unpersisted correctly
							read_back_01_step.resolve(id);
						});
						promise.otherwise(function(){
							console.error("read_back_01_step failure");
							console.error(arguments);
						});
					});

					var update_step = when.defer();
					read_back_01_step.promise.then(function() {
						console.log("[single CRUD] starting update_step...");
						// now check that we can update
						out.set('foo', 53);
						// note : how to remove a field ? TODO
						out.set('answer', null);
						var promise = out.save(); // should trigger an update
						promise.then(function(){
							// also check change monitor
							expect( out.changed_attributes() ).to.deep.equals( {} ); // since supposed to be in sync
							update_step.resolve(out.id);
						});
						promise.otherwise(function(){
							console.error("update_step failure");
							console.error(arguments);
						});
					});

					// read back again and check props
					var read_back_02_step = when.defer();
					update_step.promise.then(function(id) {
						console.log("[single CRUD] starting read_back_02_step...");
						// check that we can read back and that data is correct
						var out2 = new TestModel();
						out2.id = id;
						var promise = out2.fetch(); // fetch by id
						promise.then(function(){
							// also check change monitor
							expect( out2.changed_attributes() ).to.deep.equals( {} ); // since supposed to be in sync
							expect( out2.attributes ).to.deep.equals(_.extend({}, attributes_snapshot, { 'foo': 53, 'answer': null }) ); // should be up-to-date
							read_back_02_step.resolve(id);
						});
						promise.otherwise(function(){
							console.error("read_back_02_step failure !");
							console.error(arguments);
						});
					});

					// eventually delete it
					var destroy_step = when.defer();
					read_back_02_step.promise.then(function(id) {
						console.log("[single CRUD] starting destroy_step...");
						var promise = out.destroy();
						promise.then(function() {
							expect( out.changed_attributes() ).to.deep.equals( out.attributes ); // since fully out of sync
							// actual deletion will be checked in next step
							destroy_step.resolve(id);
						});
						promise.otherwise(function() {
							console.error("destroy_step failure !");
							console.error(arguments);
						});
					});

					destroy_step.promise.then(function(id) {
						console.log("[single CRUD] starting final step...");
						// try to read to check if correctly deleted
						var out2 = new TestModel();
						out2.id = id;
						var promise = out2.fetch(); // fetch by id
						promise.otherwise(function(infos) {
							expect( infos[1] ).to.be.instanceOf(Error);
							signalAsyncTestFinished();
						});
						promise.then(function(){
							console.error("read_back_03_step failure !");
							console.error(arguments);
						});
					});

				});

				it('should allow multiple Creation, Read, Update, Delete', function(signalAsyncTestFinished) {
					var out = new this.TestModel();

					// this time we'll create several objects
					var out1 = new this.TestModel({ name: 'one'});
					var initial_save_step = out1.save();
					var out2 = new this.TestModel({ name: 'two'});
					initial_save_step = when.join(initial_save_step, out2.save());
					var out3 = new this.TestModel({ name: 'three'});
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

				it('should correctly allow attribute deletion ?');

			});

		}); // describe CUT
	};

	return should_implement_backbone_sync_api;

}); // requirejs module
