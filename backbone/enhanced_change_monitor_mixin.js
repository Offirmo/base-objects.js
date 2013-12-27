/* Reimplementation of set() and unset() of Backbone.Model,
 * to provide an enhanced change monitor,
 * since the default one only remember values before the last set().
 * This new one, accessible through changed_attributes() and previous_attributes()
 * records all changes since the last declare_in_sync() call.
 * Of course, canceled changes are properly removed from change record.
 * Warning : This mixin only works properly on an ExtensibleModel.
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'backbone',
	'base-objects/backbone/extensible_model'
],
function(_, Backbone, ExtensibleBackboneModel) {
	"use strict";


	/////// Improved change monitor ///////
	// override of set()
	function enhanced_set(original_set_func, key, val, options) {
		if (key == null) return this;

		// since we need to look at the arguments,
		// we must uniformize them like set() would have.
		// Handle both `"key", value` and `{key: value}` -style arguments.
		var attrs;
		if (typeof key === 'object') {
			attrs = key;
			options = val;
		} else {
			(attrs = {})[key] = val;
		}

		// apply real func
		var return_val = original_set_func.call(this, key, val, options);

		// loop over new values
		if(!this.hasOwnProperty('previous_attributes_')) {
			// enhanced changes detection not initialized :
			// we must be at object creation
			// ignore.
			return return_val;
		}

		for(var key in attrs)
		{
			if(attrs.hasOwnProperty(key))
			{
				// check against *real* value, just in case
				var new_value = this.attributes[key];
				if(this.previous_attributes_.hasOwnProperty(key) && this.previous_attributes_[key] === new_value) {
					// set back to original value
					//console.log("Offirmo cancelling change : " + key + " -> " + new_value);
					delete this.changed_attributes_[ key ];
				}
				else {
					// record new value
					//console.log("Offirmo detecting change : " + key + " -> " + new_value);
					this.changed_attributes_[key] = new_value;
				}
			}
		}

		return return_val;
	}

	function initialize() {
		this.declare_in_sync();
	}

	var methods = {
		declare_in_sync: function() {
			this.changed_attributes_ = {};
			this.previous_attributes_ = _.clone( this.attributes );
		},
		previous_attributes: function() {
			return _.clone( this.previous_attributes_ );
		},
		changed_attributes: function() {
			return _.clone( this.changed_attributes_ );
		},
		// special : though seldom used, we may have to manually declare all attributes out of sync
		// (happen when deleted on server)
		declare_fully_out_of_sync: function() {
			this.changed_attributes_ = _.clone( this.attributes );
			this.previous_attributes_ = {};
		},
	};


	/////// Improved change monitor ///////
	var ImprovedChangeMonitorMixin = {
		mixin: function(prototype) {

			// check if given param is really a prototype (common error)
			if(!prototype.hasOwnProperty('constructor'))
				throw new Error("Backbone enhanced change monitor mixin() must be passed a prototype !");

			// check if object is truly an Offirmo Extensible Model ?

			// check if this object was already mixed ?

			// backup original functions
			var original_proto = Object.create(prototype);
			var original_set = original_proto.set;
			var original_unset = original_proto.unset;

			// encapsulate them
			prototype.set = function( key, val, options) {
				return enhanced_set.call(this, original_set, key, val, options);
			};
			// unset todo

			// add other functions
			_.extend(prototype, methods);

			// add an init
			ExtensibleBackboneModel.add_initialization_fn(prototype, initialize);
		}
	};

	return ImprovedChangeMonitorMixin;
}); // requirejs module
