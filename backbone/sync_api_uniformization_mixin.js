/* Reimplementation of save(), fetch(), destroy and sync() of Backbone.Model,
 * for them to uniformly returns promises (when.js)
 *
 *
 * NOTE : exceptions thrown by the original function will be caught
 *        and turned into a promise rejection.
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore',
	'backbone',
	'when'
],
function(_, Backbone, when) {
	'use strict';


	// utility to uniformize API  XXX IN PROGRESS TOREVIEW XXX
	// return a promise :
	// - which resolves to [ model, response, options ]
	// - which fails with [ model, xhr, options ]  XXX <--- TOREVIEW
	function uniformize_API_for_func(func, arguments_)
	{
		// immediately launch the method so it can begin to work
		// REM : may return
		// - false   (original backbone)
		// - a jQXHR (original backbone)
		// - a promise if func is already promise-enabled
		var unknownResult = undefined;
		try {
			unknownResult = func.apply(this, arguments_);
		}
		catch(e) {
			// Yes, we choose to catch exceptions and constrive them into a promise failure.
			// This is a choice. Make it configurable ?
			return when.reject(e);
		}

		if(when.isPromiseLike(unknownResult)) {
			// Called func already returned a promise.
			// Perfect, nothing to do !
			return unknownResult;
		}

		// not a promise, so we prepare one
		var deferred = when.defer();
		var promise = deferred.promise;

		// now examine returned value
		if(typeof unknownResult === 'undefined') {
			// that's bad : the called function doesn't follow the expected API at all
			console.error('Error when calling func ', func, ', returned undef...');
			deferred.reject( new Error('From Backbone sync uniformization : underlying sync func didn´t follow Backbone API !') );
		}
		else if(unknownResult === false) {
			// Backbone may do that.
			// that's precisely what we want to normalize
			deferred.reject( new Error('From Backbone sync uniformization : underlying sync func returned false !') );
		}
		else if(_.isObject( unknownResult ) && unknownResult instanceof Error) {
			var error = unknownResult;
			// There was an exception during the call
			deferred.reject( error );
		}
		else
		{
			// it's a jqXhr
			var jqXhr = unknownResult;
			// plug jqXhr to the deferred
			// from Backbone doc http://api.jquery.com/jQuery.ajax/#jqXHR
			jqXhr.done(function( data, textStatus, jqXHR ) {
				// TOREVIEW
				deferred.resolve( data );
			});
			jqXhr.otherwise(function( jqXHR, textStatus, errorThrown ) {
				deferred.reject( errorThrown );
			});
		}

		// special @see enhanced change monitor
		if(this.declare_in_sync) {
			promise.then(function(){
				// any success (XXX even sync() ?) means object is in sync
				this.declare_in_sync();
			});
		}

		return promise;
	}

	// will be called in context of a BB Model
	function not_implemented_find() {
		var deferred = when.defer();
		deferred.reject( [ this, new Error('From Backbone sync uniformization : find() not available for this model !') ] );
		return deferred.promise;
	}

	/////// API uniformization ///////
	var UniformizedBackboneSyncApiMixin = {
		mixin: function(prototype) {

			// check if given param is really a prototype (common error)
			if(!prototype.hasOwnProperty('constructor'))
				throw new Error('Backbone sync uniformization mixin() must be passed a prototype !');

			// check if this object was already mixed ?

			// backup original functions
			var original_proto = Object.create(prototype);
			var original_save    = original_proto.save;
			var original_fetch   = original_proto.fetch;
			var original_destroy = original_proto.destroy;
			var original_sync    = original_proto.sync;

			// encapsulate them
			prototype.save = function() {
				return uniformize_API_for_func.call(this, original_save, arguments);
			};
			prototype.fetch = function() {
				return uniformize_API_for_func.call(this, original_fetch, arguments);
			};
			prototype.destroy = function() {
				return uniformize_API_for_func.call(this, original_destroy, arguments);
			};
			// This one is not in Backbone.
			prototype.find = function() {
				var err = new Error('find() is not implemented for now !');
				err.http_status_hint = 501;
				return when.reject(err);
			};
		}
	};

	return UniformizedBackboneSyncApiMixin;
}); // requirejs module
