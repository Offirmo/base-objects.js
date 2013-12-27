/* Example of Offirmo object
 * (for copy/paste new objects)
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'base-objects/backbone/named_object'
],
function(_, NamedObject) {
	"use strict";

	var constants = {
		// ...
	};
	Object.freeze(constants);


	function validate_xyz(attrs, options) {

		// return nothing
	}


	var ParentModel = NamedObject;
	var parentModel_reference_instance = new ParentModel;

	var ExampleObject = ParentModel.extend({

		defaults: function(){
			ParentModel.prototype.defaults.call(this);

			this.set({
				serialization_version: 1
			});
		},

		initialize: function(){
			ParentModel.prototype.initialize.call(this);

			this.url = 'sampleobject'; //< (backbone) url fragment for this object
			this.add_validation_fn(validate_xyz);
		},

		// override of parent
		sync: function(method, model, options)
		{
			options || (options = {});

			//console.log("Backbone.ExampleObject.sync called : " + method, options);

			if(method === 'read') {
				throw 'ExampleObject sync update not implemented !';
			}
			else if(method === 'update') {
				throw 'ExampleObject sync update not implemented !';
			}
			else {
				throw 'ExampleObject sync ' + method + ' not supported !';
			}
		}

	});

	// allow "class member" like access to constants
	ExampleObject.constants = constants;

	return ExampleObject;
}); // requirejs module
