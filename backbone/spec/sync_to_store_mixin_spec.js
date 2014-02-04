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

			// shared test suite
			should_implement_backbone_sync_api();
		});


		describe('operations', function() {

			it('should also work with a model-wide store', function(signalAsyncTestFinished) {
				var MUTWS = MUT.extend({});
				var store = GenericStore.make_new("memory");
				CUT.set_model_store(MUTWS.prototype, store);

				// this time we'll create several objects
				var out1 = new MUTWS({ name: 'one'});
				var out2 = new MUTWS({ name: 'two'});
				var out3 = new MUTWS({ name: 'three'});
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

		});

	}); // describe CUT
}); // requirejs module
