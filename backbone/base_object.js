/* A 'base' Backbone object from which all offirmo objects will inherit
 * useful to add some utilities, namely :
 * - serialization version (+ corresponding validation)
 * - caching strategy with associated infos
 * - extensible validation
 * - overriden id/url generation
 * - ...
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'backbone'
],
function(_, Backbone) {
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
		// return nothing
	}


	var BaseObject = Backbone.Model.extend({

		defaults: function(){

			// model properties
			this.set({

				/////// serialization control (in progress) ///////
				// incrementing this code each time the schema changes
				// allows to match serialization code and serialized data
				serialization_version: 0,

				// attributes that should not be persisted
				// (usually because constants or client-only)
				// TOREVIEW separate client only / server only
				attributes_serialization_blacklist: [
					'constants', 'aggregation_parent', 'aggregation_parent_only_child',
					'last_fetch_origin', 'last_server_fetch_date',
					'cache_strategy', 'cache_max_duration',
					'restlink_client'
				],


				/////// URL generation (in progress) ///////
				url: 'basemodel', //< (backbone) url fragment for this object (should be overriden by derived classe)
				aggregation_parent: undefined, //< parent/owner of this object
				//  important for building a correct url : parent/<id>/child/<id>
				// without using Backbone collections
				aggregation_parent_only_child: false, //< by default, consider there are
				// several children like us under the parent
				// so we'll add our id into the url
			});
		},

		initialize: function() {

			// meta properties (not in the model)

			/////// extensible validation (in progress) ///////
			this.validation_methods = [];

			// add validations
			this.add_validation_fn( validate_serialization_version );

			/////// cache control (in progress) ///////
			this.last_fetch_origin = constants.fetch_origin_none; //< Origin of last fetch ?
			this.last_server_fetch_date = undefined; //< TOREVIEW
			this.cache_strategy = constants.cache_strategy_cachable; // by default
			this.cache_max_duration = undefined; // TOREVIEW

			this.restlink_client = undefined; //< the restlink client to which we'll sync

		},

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

		set_restlink_client: function(client) {
			this.restlink_client = client;
		},

		// if asked for a refresh,
		// do this object really needs a refresh from the server
		// or is it still valid according to its cache status ?
		really_needs_refresh: function() {
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
		},

		compute_id: function() {
			return this.get('id'); // by default
		},

		compute_url: function() {
			var this_url = '';
			var aggregation_parent = this.get('aggregation_parent');
			if(aggregation_parent) {
				this_url = aggregation_parent.compute_url() + '/';
			}
			this_url = this_url + this.get('url') + '/' + this.compute_id();
			return this_url;
		}

	});

	// allow "class member" like access to constants
	BaseObject.constants = constants;

	return BaseObject;
}); // requirejs module
