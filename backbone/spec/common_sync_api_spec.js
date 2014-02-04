/* Shared tests for compliance to the Backbone sync API
 * >>> this.CUT MUST be set to the class under test
 *     and this.TestModel to the Model to use.
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'chai',
	'when',
	'mocha'
],
function(_, chai, when) {
	"use strict";

	var expect = chai.expect;

	var should_implement_backbone_sync_api = function() {

		describe('Backbone sync API implementation [shared]', function() {

			describe('operations', function() {

				it('should correctly handle missing records', function(signalAsyncTestFinished) {
					var out = new this.TestModel();
					out.id = 'toto'; // non-existent id

					var promise = out.fetch(); // should fail
					var final_promise = promise.then(function() {
						// impossible
						throw new Error("impossible fetch succeeded !");
					},
					function(e) {
						expect( e ).to.be.instanceOf(Error); // REM : may fail
						signalAsyncTestFinished();
					});

					final_promise.otherwise(function(e) {
						signalAsyncTestFinished(e);
					});
				});

				it('fetch should correctly overwrite unsaved changes', function(signalAsyncTestFinished) {
					var out = new this.TestModel();
					out.set('foo', 'bar');

					var save_step = out.save();

					// now synchronously modify local version even while it's (supposedly) being saved (somewhat race condition test)
					out.set('foo', 'barz');
					out.set('answer', 42); // new attrib

					// now read back
					var fetch_step = save_step.then(function() {
						return out.fetch();
					});

					// unsaved local changes should have been forgotten
					var final_step = fetch_step.then(function() {
						expect( out.attributes ).to.deep.equals({ 'foo': 'bar' });
					});

					final_step.then(function() {
						signalAsyncTestFinished();
					},
					function(e) {
						signalAsyncTestFinished(e);
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
					var create_step = create_promise.then(function() {
						expect( out.id ).to.not.be.undefined;
						// also check change monitor
						expect( out.previous_attributes() ).to.deep.equals( attributes_snapshot );
						expect( out.changed_attributes() ).to.deep.equals( {} ); // since supposed to be in sync
						return out.id;
					});

					var read_back_01_step = create_step.then(function(id) {
						console.log("[single CRUD] starting read_back_01_step...");
						// now check that we can read back
						var out2 = new TestModel();
						out2.id = id; // set id explicitely
						var promise = out2.fetch(); // will fetch by id
						return promise.then(function() {
							// also check change monitor
							expect( out2.changed_attributes() ).to.deep.equals( {} ); // since supposed to be in sync
							expect( out2.attributes ).to.deep.equals( attributes_snapshot ); // if unpersisted correctly
						});
					});

					var update_step = read_back_01_step.then(function() {
						console.log("[single CRUD] starting update_step...");
						// now check that we can update
						out.set('foo', 53);
						// note : how to remove a field ? TODO
						out.set('answer', null);
						var promise = out.save(); // should trigger an update
						return promise.then(function(){
							// also check change monitor
							expect( out.changed_attributes() ).to.deep.equals( {} ); // since supposed to be in sync
							return out.id;
						});
					});

					// read back again and check props
					var read_back_02_step = update_step.then(function(id) {
						console.log("[single CRUD] starting read_back_02_step...");
						// check that we can read back and that data is correct
						var out2 = new TestModel();
						out2.id = id;
						var promise = out2.fetch(); // fetch by id
						return promise.then(function(){
							// also check change monitor
							expect( out2.changed_attributes() ).to.deep.equals( {} ); // since supposed to be in sync
							expect( out2.attributes ).to.deep.equals(_.extend({}, attributes_snapshot, { 'foo': 53, 'answer': null }) ); // should be up-to-date
							return id;
						});
					});

					// eventually delete it
					var destroy_step = read_back_02_step.then(function() {
						console.log("[single CRUD] starting destroy_step...");
						var promise = out.destroy();
						return promise.then(function(id) {
							expect( out.changed_attributes() ).to.deep.equals( out.attributes ); // since fully out of sync
							// actual deletion will be checked in next step
							return id;
						});
					});

					var final_step = destroy_step.then(function(id) {
						console.log("[single CRUD] starting final step...");
						// try to read to check if correctly deleted
						var out2 = new TestModel();
						out2.id = id;
						var promise = out2.fetch(); // fetch by id -> should fail
						return promise.then(function() {
							throw new Error("read_back_03_step unexpected success !");
						},
						function(e) {
							expect( e ).to.be.instanceOf(Error);
							return true; // change back this rejection into a success
						});
					});

					final_step.then(function() {
						signalAsyncTestFinished();
					},
					function(e) {
						signalAsyncTestFinished(e);
					});
				});

				it('should allow multiple Creation, Read, Update, Delete', function(signalAsyncTestFinished) {
					// this time we'll create several objects
					var out1 = new this.TestModel({ name: 'one'});
					var out2 = new this.TestModel({ name: 'two'});
					var out3 = new this.TestModel({ name: 'three'});
					var initial_save_step = when.join(out1.save(), out2.save(), out3.save());

					// OK we have (promised !) three records. Mess with them.
					var modif_step = initial_save_step.then(function() {
						// modif #1
						out1.set("code", 1);
						var tmp_modif_step = out1.save();
						// destroy #2
						tmp_modif_step = when.join( tmp_modif_step, out2.destroy() );
						// modif #3
						out3.set({name: 'suii', "code": 3});
						tmp_modif_step = when.join( tmp_modif_step, out3.save() );
						return tmp_modif_step;
					});


					// ok now let's fetch them again to see if records didn't mess themselves
					var final_step = modif_step.then(function() {
						// fetch #1
						var tmp_check_step = out1.fetch().then(function(attributes) {
							expect( attributes ).to.deep.equals({ name: 'one', "code": 1});
						});
						// fetch #2 (should fail)
						tmp_check_step = when.join( tmp_check_step, out2.fetch().then(function() {
							throw new Error("Unexpected #2 fetch success !");
						},
						function(e) {
							return true; // error as expected, turn it into a success
						}) );
						// fetch #3
						tmp_check_step = when.join( tmp_check_step, out3.fetch().then(function(attributes) {
							expect( attributes ).to.deep.equals({ name: 'suii', "code": 3});
						}) );
						return tmp_check_step;
					});

					final_step.then(function() {
						signalAsyncTestFinished();
					},
					function(e) {
						signalAsyncTestFinished(e);
					});
				});

				it('should correctly allow attribute deletion ?');

			});

		}); // describe CUT
	};

	return should_implement_backbone_sync_api;

}); // requirejs module
