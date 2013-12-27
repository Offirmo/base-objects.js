/* A 'base' Backbone object enhancing a default Backbone object :
 * - extensible validation
 * - by default, a 'serialization version' property (+ corresponding validation)
 * - save(), fetch() and sync() now uniformly returns when promises
 * - improved attributes change monitor
 * - selector to various sync implementations
 *
 * In progress / toreview
 * - overriden id/url generation
 * - caching strategy with associated infos
 * - ...
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'backbone',
	'when'
],
function(_, Backbone, when) {
	"use strict";

	// constants, all grouped under a common property for readability
	var constants = {
		// ...
	};
	Object.freeze(constants);


	// validation methods :
	function validate_serialization_version(attrs, options) {
		if(_.isUndefined(attrs.serialization_version)) {
			return 'Must have a serialization version !';
		}
		if(!_.isNumber(attrs.serialization_version)) {
			return 'Serialization version must be a number !';
		}
		if(attrs.serialization_version < 0) {
			return 'Serialization version must be >= 0 !';
		}
		// return nothing = OK
	}


	// utility to uniformize API  XXX IN PROGRESS TOREVIEW XXX
	// return a promise :
	// - which resolves to [ model, response, options ]
	// - which fails with [ model, xhr, options ]  XXX <--- TOREVIEW
	function uniformize_API_for_func(func, that, arguments_) {
		// immediately launch the method so it can begin to work
		// REM : may return
		// - false
		// - a jQXHR
		// - a promise if func is already promise-enabled
		var unknownResult = func.apply(that, arguments_);
		// now prepare our interface
		var when_deferred = when.defer();
		if(typeof unknownResult === 'undefined') {
			// that's bad : the called function doesn't follow the expected API at all
			console.error("Error when calling func ", func, ", returned undef...");
			when_deferred.reject( [ this ] /* todo improve */ );
		}
		else if(unknownResult === false) {
			// Backbone may do that.
			// that's precisely what we want to normalize
			when_deferred.reject( [ this ] /* todo improve */ );
		}
		else if(when.isPromiseLike(unknownResult)) {
			// called func already returns a promise
			// perfect, nothing to do !
			return unknownResult;
		}
		else
		{
			// it's a jqXhr
			var jqXhr = unknownResult;
			// plug jqXhr to the deferred
			// from Backbone doc :
			// success and error callbacks (...) are passed (model, response, options) and (model, xhr, options) as arguments,

			jqXhr.done(function( model, response, options ) {
				when_deferred.resolve( [ model, response, options ] );
			});
			jqXhr.otherwise(function( model, xhr, options ) {
				when_deferred.reject( [ model, xhr, options ] );
			});
		}
		return when_deferred.promise;
	}



	var BaseObject = Backbone.Model.extend({

		defaults: function(){
			// model properties
			this.set({
				/////// serialization control (in progress) ///////
				// incrementing this code each time the schema changes
				// allows to match serialization code and serialized data
				serialization_version: 0 // default value, to be overriden
			});
		},

		initialize: function() {
			// meta properties (not in the model)

			/////// extensible validation (in progress) ///////
			this.validation_methods = [];

			// add validations for this object
			this.add_validation_fn( validate_serialization_version );

			/////// Improved change monitor (in progress) ///////
			this.declare_in_sync();

			 /////// URL generation (in progress) ///////
			this.url = 'basemodel'; //< (backbone) url fragment for this object (should be overriden by derived class)
			this.aggregation_parent = undefined; //< parent/owner of this object
			//  important for building a correct url : parent/<id>/child/<id>
			// without using Backbone collections
			this.aggregation_parent_only_child = false; //< by default, consider there are
			// several children like us under the parent
			// so we'll add our id into the url

			// backend
			//this.restlink_client = undefined; //< the restlink client to which we'll sync
		},


		/////// Improved change monitor ///////
		// override of set()
		set: function OffirmoBaseObjectOverridenSet(key, val, options) {
			if (key == null) return this;

			// Handle both `"key", value` and `{key: value}` -style arguments.
			var attrs;
			if (typeof key === 'object') {
				attrs = key;
				options = val;
			} else {
				(attrs = {})[key] = val;
			}

			// apply real func
			var return_val = Backbone.Model.prototype.set.apply(this, arguments);

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
		},
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


		/////// extensible validation ///////
		add_validation_fn: function(validation_fn) {
			this.validation_methods.push(validation_fn);
		},

		validate: function(attrs, options) {
			var errors = [];

			for(var i = 0; i < this.validation_methods.length; ++i) {
				var temp = this.validation_methods[i].apply(this, arguments);
				if(typeof temp !== 'undefined')
					if(_.isArray(temp))
						errors.concat(temp);
					else
						errors.push(temp);
			}

			if( errors.length == 1 )
				return errors[0];
			else if( errors.length)
				return errors;
			// or else return nothing
		},


		/////// backend utilities (in progress) ///////
		/*set_restlink_client: function(client) {
			this.restlink_ = client;
		},
		set_cache: function(cache) {
			this.cache_ = cache;
		},
		set_store: function(store) {
			this.store_ = store;
		},*/


		// specialized version to be used with a store
		sync_to_store: function(method, model, options) {
			console.log("sync_to_store begin('"+method+"',...) called with ", arguments);
			var when_deferred = when.defer();

			var id = this.compute_url();

			if(method === "read") {
				if(typeof id === 'undefined')
					throw new Error("can't fetch without id !");
				var data = model.store_.get(id);
				// apply fetched data
				model.set(data);
				// all in sync
				model.declare_in_sync();
				when_deferred.resolve( [model, undefined, options] );
			}
			else if(method === "create") {
				// use Backbone id as server id
				model.id = model.cid;
				model.store_.set(id, model.attributes);
				model.declare_in_sync();
				when_deferred.resolve( [model, undefined, options] );
			}
			else if(method === "update") {
				if(typeof id === 'undefined')
					throw new Error("can't update without id !");
				model.store_.set(id, model.attributes);
				model.declare_in_sync();
				when_deferred.resolve( [model, undefined, options] );
			}
			else if(method === "delete") {
				if(typeof id === 'undefined')
					throw new Error("can't delete without id !");
				model.store_.set(id, undefined);
				model.id = undefined;
				model.declare_in_sync();
				when_deferred.resolve( [model, undefined, options] );
			}
			else {
				// WAT ?
			}

			console.log("sync_to_store end - Current changes = ", model.changed_attributes());
			return when_deferred.promise;
		},


		/////// API uniformization ///////
		save: function() {
			return uniformize_API_for_func(Backbone.Model.prototype.save, this, arguments);
		},
		fetch: function() {
			return uniformize_API_for_func(Backbone.Model.prototype.fetch, this, arguments);
		},
		sync: function() {
			return uniformize_API_for_func(Backbone.Model.prototype.sync, this, arguments);
		},


		// to be overriden if needed
		compute_id: function() {
			return this.id; // by default
		},

		compute_url: function() {
			var this_url = '';
			if(this.aggregation_parent) {
				this_url = this.aggregation_parent.compute_url() + '/';
			}
			this_url = this_url + /* '/' +*/ this.url + '/' + this.compute_id();
			return this_url;
		}

	});

	// allow "class member" like access to constants
	BaseObject.constants = constants;

	return BaseObject;
}); // requirejs module
