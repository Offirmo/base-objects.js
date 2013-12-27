if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'chai',
	'underscore',
	'backbone',

	'base-objects/backbone/extensible_model',
	'base-objects/backbone/enhanced_change_monitor_mixin',

	'mocha'
],
function(chai, _, Backbone, ExtensibleBackboneModel, CUT) {
	"use strict";

	var expect = chai.expect;
	//chai.should();
	chai.Assertion.includeStack = true; // defaults to false

	describe('[Backbone Mixin] Enhanced attributes change monitor', function() {

		describe('mixin()', function() {

			it('should mix !', function() {
				var MUT = ExtensibleBackboneModel.extend({});
				CUT.mixin(MUT.prototype);
				var out = new MUT();

				// yes that's all. basic of the basic.
			});


			it('should prevent a common param error', function() {
				var MUT = ExtensibleBackboneModel.extend({});

				var tempfn = function() { CUT.mixin(MUT); }; // bad bad we should have passed the prototype
				expect( tempfn ).to.throw(Error, "Backbone enhanced change monitor mixin() must be passed a prototype !");
			});

		});


		describe('', function() {


			it('should properly monitor all changes : set()', function() {
				var MUT = ExtensibleBackboneModel.extend({});
				CUT.mixin(MUT.prototype);
				var out = new MUT();

				var attributes_snapshot = _.clone( out.attributes );

				// let's do a change
				out.set("foo", "bar");
				expect( out.previous_attributes() ).to.deep.equals( attributes_snapshot );
				expect( out.changed_attributes() ).to.deep.equals( { "foo": "bar" } );

				// let's do multiple changes
				out.set({"toto": "titi", "foo": "bar2"});
				expect( out.previous_attributes() ).to.deep.equals( attributes_snapshot );
				expect( out.changed_attributes() ).to.deep.equals( { "foo": "bar2", "toto": "titi" } );

				// sync
				out.declare_in_sync();
				attributes_snapshot = _.clone( out.attributes ); // update
				expect( attributes_snapshot ).to.deep.equals( {
					"foo": "bar2",
					"toto": "titi"
				});
				expect( out.previous_attributes() ).to.deep.equals( attributes_snapshot );
				expect( out.changed_attributes() ).to.deep.equals( {} );

				// let's do a change
				out.set("foo", "bar3");
				expect( out.previous_attributes() ).to.deep.equals( attributes_snapshot );
				expect( out.changed_attributes() ).to.deep.equals( { "foo": "bar3" } );

				// let's cancel it
				out.set("foo", "bar2");
				expect( out.previous_attributes() ).to.deep.equals( attributes_snapshot );
				expect( out.changed_attributes() ).to.deep.equals( { } ); // nothing more
			});

			it('should properly monitor all changes : unset()');
		});

	}); // describe CUT
}); // requirejs module
