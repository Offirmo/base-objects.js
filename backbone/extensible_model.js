/* Derived from Backbone.Model,
 * a more extensible Backbone object :
 * - extensible defaults
 * - extensible init
 * - extensible validation
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'backbone'
],
function(_, Backbone) {
	"use strict";

	var ExtensibleModel = Backbone.Model.extend({

		/////// extensible defaults ///////
		// override of Backbone.Model
		defaults: function() {
			if(this.defaults_) {
				var temp = _.reduce(
					this.defaults_,
					function(memo, defaults /*, index, list*/) {
						// may be a hash or a func
						if(_.isFunction(defaults)) {
							// pass memo as param, just in case
							return _.extend(memo, defaults(memo));
						} else {
							return _.extend(memo, defaults);
						}
					},
					{});
				return temp;
			}
			// return nothing
		},

		/////// extensible initialization ///////
		// override of Backbone.Model
		initialize: function() {
			if(this.initialization_methods_) {
				for(var i = 0; i < this.initialization_methods_.length; ++i) {
					this.initialization_methods_[i].apply(this, arguments);
				}
			}
		},

		/////// extensible validation ///////
		// override of Backbone.Model
		validate: function(attrs, options) {
			if(this.validation_methods_) {
				var errors = [];

				for(var i = 0; i < this.validation_methods_.length; ++i) {
					var temp = this.validation_methods_[i].apply(this, arguments);
					if(typeof temp !== 'undefined')
						if(_.isArray(temp))
							errors.concat(temp);
						else
							errors.push(temp);
				}

				if( errors.length > 0 )
					return errors; // always as an array, so the API is coherent
				// or else return nothing
			}
			// return nothing
		}
	});



	// Supposing an array prototype property
	// we want to be sure the given prototype has this array property
	// and also be sure that it has its *own* (hasOwnProperty) version
	// so we can modify the content without affecting parent (if any)
	// This func may be called several time, it is non destructive.
	function ensure_own_inherited_array_property(prototype, property_name) {
		if(prototype.hasOwnProperty(property_name)) {
			// already present, do nothing
		}
		else {
			var existing = prototype[property_name]; // may be undefined if none
			if(_.isArray(existing)) {
				prototype[property_name] = existing.concat(); // duplicate parent
			}
			else {
				prototype[property_name] = [];
			}
		}
	}

	// add 'static' functions
	ExtensibleModel.add_defaults = function(prototype, defaults) {

		// check if given param is really a prototype (common error)
		if(!prototype.hasOwnProperty('constructor'))
			throw new Error("Backbone Extensible Model : this func must be passed a prototype !");
		// check tho other param
		if(!(_.isObject(defaults) || _.isFunction(defaults)))
			throw new Error("Backbone Extensible Model : this func must be passed a correct default !");

		ensure_own_inherited_array_property(prototype, 'defaults_');
		prototype.defaults_.push(defaults);
	};

	ExtensibleModel.add_initialization_fn = function(prototype, init_fn) {

		// check if given param is really a prototype (common error)
		if(!prototype.hasOwnProperty('constructor'))
			throw new Error("Backbone Extensible Model : this func must be passed a prototype !");
		// check tho other param
		if(!_.isFunction(init_fn))
			throw new Error("Backbone Extensible Model : this func must be passed a function !");

		ensure_own_inherited_array_property(prototype, 'initialization_methods_');
		prototype.initialization_methods_.push(init_fn);
	};

	ExtensibleModel.add_validation_fn = function(prototype, validation_fn) {

		// check if given param is really a prototype (common error)
		if(!prototype.hasOwnProperty('constructor'))
			throw new Error("Backbone Extensible Model : this func must be passed a prototype !");
		// check tho other param
		if(!_.isFunction(validation_fn))
			throw new Error("Backbone Extensible Model : this func must be passed a function !");

		ensure_own_inherited_array_property(prototype, 'validation_methods_');
		prototype.validation_methods_.push(validation_fn);
	};


	return ExtensibleModel;
}); // requirejs module
