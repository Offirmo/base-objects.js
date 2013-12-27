/* Implementation of Backbone.Model.sync() to/from a store.
 * NOTE : this sync() uses uniformized API and always returns a promise.
 * @see sync_api_uniformization_mixin
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

	var methods = {

		set_store: function(store) {
			this.store_ = store;
		},

		sync: function(method, model, options) {
			//console.log("sync() to store begin('"+method+"',...) called with ", arguments);
			var deferred = when.defer();

			// just in case
			try {
				var unique_record_id = model.url(); // we use the unique url as an id

				if(method === "read") {
					if(typeof unique_record_id === 'undefined')
						throw new Error("sync() to store : can't fetch without id !");
					var data = model.store_.get(unique_record_id);
					// apply fetched data
					if(typeof data === 'undefined') {
						// not found
						throw new Error("sync() to store : read : record not found !");
					}
					else if(typeof data !== 'object') {
						// WAT ?
						throw new Error("sync() to store : read : internal error : store conflict ?");
					}
					else {
						// it worked.
						// we can't just overwrite, we must clear all attrs first (to suppress added one)
						model.clear();
						// now we can set
						model.set(data);
						// all in sync
						model.declare_in_sync();
						deferred.resolve( [model, undefined, options] );
					}
				}
				else if(method === "create") {
					// use Backbone id as server id
					model.id = model.cid;
					// recompute persist id now that we set an id
					var unique_persist_id = model.url(); // we use the unique url as an id
					model.store_.set(unique_persist_id, model.attributes);
					model.declare_in_sync();
					deferred.resolve( [model, undefined, options] );
				}
				else if(method === "update") {
					if(typeof unique_record_id === 'undefined')
						throw new Error("sync() to store : can't update without id !");
					var data = model.store_.get(unique_record_id);
					if(typeof data !== 'object') {
						// WAT ?
						throw new Error("sync() to store : update : no existing record !");
					}
					else {
						_.extend(data, model.attributes);
						// TODO how to handle unset ?
					}
					model.store_.set(unique_record_id, data);
					model.declare_in_sync();
					deferred.resolve( [model, undefined, options] );
				}
				else if(method === "delete") {
					if(typeof unique_record_id === 'undefined')
						throw new Error("sync() to store : can't delete without id !");
					model.store_.set(unique_record_id, undefined);
					model.id = undefined; // really ?
					model.declare_fully_out_of_sync(); // since no longer saved on server
					deferred.resolve( [model, undefined, options] );
				}
				else {
					throw new Error("sync() to store : unrecognized method !");
				}
			}
			catch(e) {
				deferred.reject( [ model, e ] );
			}

			//console.log("sync_to_store end - Current changes = ", model.changed_attributes());
			return deferred.promise;
		},

		find: function(criteria) {
			var deferred = when.defer();

			deferred.reject( [this, new Error("not implemented !")] ) ;

			return deferred.promise;
		}
	};

	/////// Final ///////
	var SyncToStoreMixin = {
		// "class" methods
		mixin: function(prototype) {

			// check if given param is really a prototype (common error)
			if(!prototype.hasOwnProperty('constructor'))
				throw new Error("Backbone sync() to store mixin() must be passed a prototype !");

			// check if this object was already mixed ?

			// add other functions
			_.extend(prototype, methods);
		},
		// set store on the model prototype, making it effective for all instances
		set_model_store: function(prototype, store) {

			// check if given param is really a prototype (common error)
			if(!prototype.hasOwnProperty('constructor'))
				throw new Error("Backbone sync() to store set_store() must be passed a prototype !");

			// set the global store
			prototype.store_ = store;
		}
	};

	return SyncToStoreMixin;
}); // requirejs module
