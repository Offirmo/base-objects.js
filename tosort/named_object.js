if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'base-objects/backbone/base_object'
],
function(_, BaseObject) {
	"use strict";

	var max_denomination_size = 70;
	var default_denomination = 'Anonymous';


	function validate_denomination(attrs, options) {
		if (typeof attrs.denomination === 'undefined') {
			return 'Must have a denomination !';
		}
		if (attrs.denomination.length === 0) {
			return 'Must have a non-empty denomination !';
		}
		if (attrs.denomination === default_denomination) {
			return 'Must have a non-default denomination !';
		}
		if (attrs.denomination.length > max_denomination_size) {
			return 'Must have a denomination smaller than ' + max_denomination_size + ' chars !';
		}
		// returns nothing
	}


	var ParentModel = BaseObject;
	var NamedObject = ParentModel.extend({

		defaults: function(){
			ParentModel.prototype.defaults.call(this);

			this.set({
				denomination: default_denomination
			});
		},

		initialize: function(){
			ParentModel.prototype.initialize.call(this);

			this.url = 'namedobject'; //< (backbone) url fragment for this object
			this.add_validation_fn(validate_denomination);
		},

		compute_id: function() {
			return this.get('denomination'); // TODO normalize
		}

	});

	return NamedObject;
}); // requirejs module
