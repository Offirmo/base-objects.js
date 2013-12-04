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
		cache_strategy_cachable: 'cachable', //< this object is allowed to be cached
		cache_strategy_always_in_sync: 'always_in_sync', //< this object should always be in sync (as much as possible)

		fetch_origin_none:   'none',   // this object was never fetched
		fetch_origin_cache:  'cache',  // this object was last fetched from cache, it may be out of sync with the server
		fetch_origin_server: 'server'  // this object was last fetched from the server, it is supposed up to date
		                               // (depending on the date and status of course !)
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
	// return :
	// - a promise
	// - resolved with [ model, response, options ]
	// - failed with [ model, xhr, options ]

	function uniformize_JjqXHRReturningFunc(func, that, arguments_) {
		// immediately launch the method so it can begin to work
		var jqXhr = func.apply(that, arguments_);
		// now prepare our interface
		var when_deferred = when.defer();
		if(typeof jqXhr === 'undefined') {
			// that's bad : the called function doesn't follow the expect API
			console.error("Error when calling func ", func, ", returned undef...");
			when_deferred.reject( [ this ] /* todo improve */ );
		}
		else if(jqXhr === false) {
			// Backbone may do that.
			// that's precisely what we want to normalize
			when_deferred.reject( [ this ] /* todo improve */ );
		}
		else if(typeof jqXhr === 'Object') {
			// Backbone may do that.
			// that's precisely what we want to normalize
			when_deferred.reject( [ this ] /* todo improve */ );
		}
		else
		{
			// plug jqXhr to the deferred
			// from Backbone doc :
			// success and error callbacks (...) are passed (model, response, options) and (model, xhr, options) as arguments,

			jqXhr.done(function( model, response, options ) {
				when_deferred.resolve( [ model, response, options ] );
			});
			jqXHR.fail(function( model, xhr, options ) {
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

			/////// cache control (in progress) ///////
			/*this.last_fetch_origin = constants.fetch_origin_none; //< Origin of last fetch ?
			this.last_server_fetch_date = undefined; //< TOREVIEW
			this.cache_strategy = constants.cache_strategy_cachable; // by default
			this.cache_max_duration = undefined; // TOREVIEW*/

			/////// serialization control (in progress) ///////
			 // attributes that should not be persisted
			 // (usually because constants or client-only)
			 // TOREVIEW separate client only / server only
			 /*attributes_serialization_blacklist: [
			 'constants', 'aggregation_parent', 'aggregation_parent_only_child',
			 'last_fetch_origin', 'last_server_fetch_date',
			 'cache_strategy', 'cache_max_duration',
			 'restlink_client'
			 ],*/


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
		set_restlink_client: function(client) {
			this.restlink_ = client;
		},
		set_cache: function(cache) {
			this.cache_ = cache;
		},
		set_store: function(store) {
			this.store_ = store;
		},


		// override of default.
		// this in an accepted technique
		sync: function(method, model, options) {
			console.log("Footprint sync('"+method+"',...) called with ", arguments);
			console.log("Sync begin - Current changes = ", model.changed_attributes());

			// XXX todo intercept success and error callbacks ?

			var when_promise;
			if(model.hasOwnProperty('cache_') && typeof model.cache_ !== 'undefined') {
				// TODO hit cache if needed
			}

			if(model.hasOwnProperty('store_') && typeof model.store_ !== 'undefined') {
				// sync to key/value store
				when_promise = model.sync_to_store(method, model, options);
			}
			else if(model.hasOwnProperty('restlink_') && typeof model.restlink_ !== 'undefined') {
				when_promise = model.sync_to_restlink(method, model, options);
			}
			else {
				when_promise = uniformize_JjqXHRReturningFunc(Backbone.Model.prototype.sync, this, arguments);
			}

			console.log("Sync end - Current changes = ", model.changed_attributes());
			return when_promise;
		},

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


		/////// API uniformization (in progress) ///////
		save: function() {
			return uniformize_JjqXHRReturningFunc(Backbone.Model.prototype.save, this, arguments);
		},
		fetch: function() {
			return uniformize_JjqXHRReturningFunc(Backbone.Model.prototype.fetch, this, arguments);
		},

		// if asked for a refresh,
		// do this object really needs a refresh from the server
		// or is it still valid according to its cache status ?
		/*really_needs_refresh: function() {
			var cache_strategy = this.get('cache_strategy');

			if(cache_strategy === Constants.always_in_sync) {
				return true;
			}

			if(typeof this.get('last_server_fetch_date') === 'undefined') {
				return true;
			}

			// todo check cache expiration
			var current_date = new Date;
			// ...

			return true; // for now
		},*/

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
