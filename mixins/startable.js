/* A mixin with generic start/stop methods
 * ready to be prototypically added to an object / prototype
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(
[
	'underscore'
],
function(_) {
	"use strict";


	////////////////////////////////////
	var constants  = {};
	var defaults   = {};
	var exceptions = {};
	var methods    = {};


	////////////////////////////////////
	//constants. = ;


	////////////////////////////////////
	//defaults. = ;
	defaults.started_ = false;
	methods.initialize_startable = function() {
		_.defaults( this, defaults );
	};


	////////////////////////////////////
	//exceptions. = ;


	////////////////////////////////////
	//methods.xyz = ...;
	methods.startup = function() {
		// TODO check consistency
		this.started_ = true;
	};
	methods.shutdown = function() {
		// TODO check consistency
		this.started_ = false;
	};
	methods.is_started = function() {
		return this.started_;
	};


	////////////////////////////////////
	Object.freeze(constants);
	Object.freeze(defaults);
	Object.freeze(exceptions);
	Object.freeze(methods);

	var DefinedClass = function OffirmoStartableObject() {
		methods.initialize_startable.apply(this, arguments);
	};

	DefinedClass.prototype.constants  = constants;
	DefinedClass.prototype.exceptions = exceptions;
	_.extend(DefinedClass.prototype, methods);


	////////////////////////////////////
	return {
		// objects are created via a factory, more future-proof
		make_new : function() { return new DefinedClass(); },
		// common use : prototypal inheritance
		// note : extended object still have to call the init function !
		mixin : function(prototype) { _.defaults(prototype, methods); },
		// exposing these allows various inheritances
		'constants'  : constants,
		'exceptions' : exceptions,
		'defaults'   : defaults,
		'methods'    : methods
	};
}); // requirejs module
